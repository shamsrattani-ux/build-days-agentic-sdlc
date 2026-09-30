import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryStickerShopStore, MOCK_SHOPPER_ID } from "./memory-store";

describe("InMemoryStickerShopStore", () => {
  let store: InMemoryStickerShopStore;

  beforeEach(() => {
    store = new InMemoryStickerShopStore();
  });

  it("lists the seeded catalog", async () => {
    const stickers = await store.listStickers();
    expect(stickers.length).toBeGreaterThan(0);
    expect(stickers[0]).toMatchObject({ id: expect.any(String), name: expect.any(String), price: expect.any(Number) });
  });

  it("returns the starting balance for the mock shopper", async () => {
    const balance = await store.getBalance(MOCK_SHOPPER_ID);
    expect(balance.credits).toBeGreaterThan(0);
  });

  it("debits the balance and records a purchase on success", async () => {
    const [sticker] = await store.listStickers();
    const before = await store.getBalance(MOCK_SHOPPER_ID);

    const result = await store.purchaseSticker(MOCK_SHOPPER_ID, sticker.id);

    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") throw new Error("expected success");
    expect(result.balance.credits).toBe(before.credits - sticker.price);

    const purchases = await store.listPurchases(MOCK_SHOPPER_ID);
    expect(purchases).toHaveLength(1);
    expect(purchases[0]).toMatchObject({ stickerId: sticker.id, price: sticker.price });
  });

  it("rejects a purchase when the balance is insufficient and leaves it unchanged", async () => {
    const stickers = await store.listStickers();
    const expensive = stickers.reduce((a, b) => (b.price > a.price ? b : a));
    // Spend down the balance first so the next purchase cannot afford `expensive`.
    for (const sticker of stickers) {
      if (sticker.id === expensive.id) continue;
      await store.purchaseSticker(MOCK_SHOPPER_ID, sticker.id);
    }
    const before = await store.getBalance(MOCK_SHOPPER_ID);
    if (before.credits >= expensive.price) {
      // Balance still covers it in this seed configuration; skip is not
      // available in this harness, so assert the affordable path instead
      // is out of scope here and fail fast to catch seed-data drift.
      throw new Error("seed data no longer produces an insufficient-credit scenario");
    }

    const result = await store.purchaseSticker(MOCK_SHOPPER_ID, expensive.id);

    expect(result.outcome).toBe("insufficient_credits");
    const after = await store.getBalance(MOCK_SHOPPER_ID);
    expect(after.credits).toBe(before.credits);
  });

  it("rejects a purchase for a sticker that does not exist", async () => {
    const before = await store.getBalance(MOCK_SHOPPER_ID);
    const result = await store.purchaseSticker(MOCK_SHOPPER_ID, "does-not-exist");
    expect(result.outcome).toBe("unavailable");
    const after = await store.getBalance(MOCK_SHOPPER_ID);
    expect(after.credits).toBe(before.credits);
  });

  it("allows only one of two concurrent purchases for the same sticker to succeed", async () => {
    const [sticker] = await store.listStickers();

    const [first, second] = await Promise.all([
      store.purchaseSticker(MOCK_SHOPPER_ID, sticker.id),
      store.purchaseSticker(MOCK_SHOPPER_ID, sticker.id),
    ]);

    const outcomes = [first.outcome, second.outcome].sort();
    expect(outcomes).toEqual(["success", "unavailable"]);

    const purchases = await store.listPurchases(MOCK_SHOPPER_ID);
    expect(purchases).toHaveLength(1);
  });
});
