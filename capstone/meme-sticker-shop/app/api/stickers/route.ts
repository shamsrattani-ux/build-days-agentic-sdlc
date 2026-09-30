import { NextResponse } from "next/server";
import { stickerShopStore } from "@/lib/memory-store";

/**
 * GET /api/stickers — the seeded sticker catalog (spec.md "Browse the
 * sticker catalog"). Returns an empty array rather than an error when the
 * catalog has no stickers left; the UI renders that as an empty state.
 */
export async function GET() {
  try {
    const stickers = await stickerShopStore.listStickers();
    return NextResponse.json({ stickers });
  } catch {
    return NextResponse.json(
      { error: "catalog_unavailable", message: "Unable to load the sticker catalog. Please try again." },
      { status: 500 },
    );
  }
}
