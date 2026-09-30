import type { Purchase, ShopperBalance, Sticker } from "./types";

/**
 * Discriminated result for a purchase attempt. Route handlers translate
 * each variant into a distinct HTTP response so the UI can show a message
 * specific to the failure reason (see spec.md "Purchase a sticker with
 * virtual credits").
 */
export type PurchaseResult =
  | { outcome: "success"; purchase: Purchase; balance: ShopperBalance }
  | { outcome: "insufficient_credits"; balance: ShopperBalance; sticker: Sticker }
  | { outcome: "unavailable" }
  | { outcome: "error" };

/**
 * Storage boundary for the sticker shop. Route handlers and UI code depend
 * only on this interface (see design.md decision 3), never on a concrete
 * adapter, so a future change can swap in a durable adapter without
 * touching route or UI code.
 */
export interface StickerShopStore {
  listStickers(): Promise<Sticker[]>;
  getBalance(shopperId: string): Promise<ShopperBalance>;
  purchaseSticker(shopperId: string, stickerId: string): Promise<PurchaseResult>;
  listPurchases(shopperId: string): Promise<Purchase[]>;
}
