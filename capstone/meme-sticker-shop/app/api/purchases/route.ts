import { NextResponse } from "next/server";
import { MOCK_SHOPPER_ID, stickerShopStore } from "@/lib/memory-store";

/**
 * GET /api/purchases — the mock shopper's purchase history (spec.md "View
 * purchase history").
 */
export async function GET() {
  try {
    const purchases = await stickerShopStore.listPurchases(MOCK_SHOPPER_ID);
    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json(
      { error: "history_unavailable", message: "Unable to load your purchase history. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/purchases — purchase a sticker (spec.md "Purchase a sticker
 * with virtual credits"). Each `StickerShopStore` purchase outcome maps to
 * a distinct response so the UI can show outcome-specific messaging.
 */
export async function POST(request: Request) {
  let stickerId: unknown;
  try {
    const body = await request.json();
    stickerId = (body as { stickerId?: unknown } | null)?.stickerId;
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof stickerId !== "string" || stickerId.length === 0) {
    return NextResponse.json(
      { error: "invalid_request", message: "A stickerId is required to purchase a sticker." },
      { status: 400 },
    );
  }

  try {
    const result = await stickerShopStore.purchaseSticker(MOCK_SHOPPER_ID, stickerId);

    switch (result.outcome) {
      case "success":
        return NextResponse.json({ purchase: result.purchase, balance: result.balance }, { status: 201 });
      case "insufficient_credits":
        return NextResponse.json(
          {
            error: "insufficient_credits",
            message: "Your credit balance is too low to purchase this sticker.",
          },
          { status: 409 },
        );
      case "unavailable":
        return NextResponse.json(
          { error: "unavailable", message: "This sticker is no longer available." },
          { status: 409 },
        );
      case "error":
        return NextResponse.json(
          { error: "purchase_failed", message: "The purchase could not be completed. Please try again." },
          { status: 500 },
        );
    }
  } catch {
    return NextResponse.json(
      { error: "purchase_failed", message: "The purchase could not be completed. Please try again." },
      { status: 500 },
    );
  }
}
