/**
 * Shared domain types for the meme sticker shop.
 *
 * These describe the Sticker entity, purchase records, and the shopper's
 * virtual credit balance. Route handlers and UI components depend only on
 * these types plus the `StickerShopStore` interface (see `store.ts`), never
 * on adapter internals.
 */

export interface Sticker {
  id: string;
  name: string;
  /** Price in virtual credits. */
  price: number;
  /** Path to the sticker image under `public/`, e.g. "/stickers/foo.svg". */
  imageUrl: string;
}

export interface Purchase {
  id: string;
  stickerId: string;
  stickerName: string;
  /** Credits paid at the time of purchase. */
  price: number;
  purchasedAt: string;
}

export interface ShopperBalance {
  shopperId: string;
  credits: number;
}
