import { NextResponse } from "next/server";
import { MOCK_SHOPPER_ID, stickerShopStore } from "@/lib/memory-store";

/**
 * GET /api/balance — the mock shopper's current credit balance (spec.md
 * "View current credit balance").
 */
export async function GET() {
  try {
    const balance = await stickerShopStore.getBalance(MOCK_SHOPPER_ID);
    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json(
      { error: "balance_unavailable", message: "Unable to load your balance. Please try again." },
      { status: 500 },
    );
  }
}
