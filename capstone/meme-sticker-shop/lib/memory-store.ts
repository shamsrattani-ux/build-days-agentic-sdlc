import type { Purchase, ShopperBalance, Sticker } from "./types";
import type { PurchaseResult, StickerShopStore } from "./store";

/**
 * Single anonymous mock shopper used for this change (see design.md
 * decision 5). Kept as an explicit parameter throughout the interface so a
 * future change introducing real identity only needs to supply a different
 * shopper id, not change the interface shape.
 */
export const MOCK_SHOPPER_ID = "mock-shopper";

// Deliberately below the sum of all seed sticker prices so that spending
// down the balance can still leave it short of the most expensive sticker,
// exercising the "insufficient credits" scenario deterministically in tests.
const STARTING_CREDITS = 40;

const SEED_STICKERS: Sticker[] = [
  { id: "sticker-doge", name: "Classic Doge", price: 10, imageUrl: "/stickers/doge.svg" },
  { id: "sticker-cat", name: "Confused Cat", price: 15, imageUrl: "/stickers/cat.svg" },
  { id: "sticker-thumbsup", name: "Big Thumbs Up", price: 5, imageUrl: "/stickers/thumbsup.svg" },
  { id: "sticker-fire", name: "This Is Fire", price: 20, imageUrl: "/stickers/fire.svg" },
  { id: "sticker-rocket", name: "To The Moon", price: 25, imageUrl: "/stickers/rocket.svg" },
  { id: "sticker-facepalm", name: "Facepalm", price: 10, imageUrl: "/stickers/facepalm.svg" },
];

let nextPurchaseId = 1;

interface MemoryState {
  stickers: Map<string, Sticker>;
  balances: Map<string, number>;
  purchases: Map<string, Purchase[]>;
}

function createInitialState(): MemoryState {
  const stickers = new Map(SEED_STICKERS.map((sticker) => [sticker.id, sticker]));
  const balances = new Map<string, number>([[MOCK_SHOPPER_ID, STARTING_CREDITS]]);
  const purchases = new Map<string, Purchase[]>([[MOCK_SHOPPER_ID, []]]);
  return { stickers, balances, purchases };
}

/**
 * In-memory adapter for `StickerShopStore` (design.md decision 3). State is
 * module-scoped and reset whenever the process restarts; this is an
 * explicit, documented limitation for this change (no durable storage yet).
 */
export class InMemoryStickerShopStore implements StickerShopStore {
  private state: MemoryState = createInitialState();

  /**
   * Serializes purchase mutations behind a promise chain (design.md
   * decision 4) so two overlapping purchase calls for the same sticker
   * cannot both observe and act on stale state.
   */
  private purchaseLock: Promise<unknown> = Promise.resolve();

  async listStickers(): Promise<Sticker[]> {
    return Array.from(this.state.stickers.values());
  }

  async getBalance(shopperId: string): Promise<ShopperBalance> {
    const credits = this.state.balances.get(shopperId) ?? 0;
    return { shopperId, credits };
  }

  async listPurchases(shopperId: string): Promise<Purchase[]> {
    return this.state.purchases.get(shopperId) ?? [];
  }

  async purchaseSticker(shopperId: string, stickerId: string): Promise<PurchaseResult> {
    const run = async (): Promise<PurchaseResult> => {
      const sticker = this.state.stickers.get(stickerId);
      if (!sticker) {
        return { outcome: "unavailable" };
      }

      const credits = this.state.balances.get(shopperId) ?? 0;
      if (credits < sticker.price) {
        return {
          outcome: "insufficient_credits",
          balance: { shopperId, credits },
          sticker,
        };
      }

      const remaining = credits - sticker.price;
      this.state.balances.set(shopperId, remaining);
      // Single-stock catalog model: a purchased sticker is removed from
      // availability, matching the "Sticker no longer available" and
      // "Concurrent purchase safety" scenarios in spec.md.
      this.state.stickers.delete(stickerId);

      const purchase: Purchase = {
        id: `purchase-${nextPurchaseId++}`,
        stickerId: sticker.id,
        stickerName: sticker.name,
        price: sticker.price,
        purchasedAt: new Date().toISOString(),
      };
      const existing = this.state.purchases.get(shopperId) ?? [];
      this.state.purchases.set(shopperId, [...existing, purchase]);

      return {
        outcome: "success",
        purchase,
        balance: { shopperId, credits: remaining },
      };
    };

    const result = this.purchaseLock.then(run, run);
    // Swallow rejection for chaining purposes only; callers still see the
    // real rejection via `result`.
    this.purchaseLock = result.catch(() => undefined);
    return result;
  }

  /** Test-only helper to reset module-scoped state between test cases. */
  __resetForTests(): void {
    this.state = createInitialState();
    this.purchaseLock = Promise.resolve();
  }
}

export const stickerShopStore = new InMemoryStickerShopStore();
