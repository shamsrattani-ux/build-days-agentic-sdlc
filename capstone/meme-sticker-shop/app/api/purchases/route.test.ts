import { describe, expect, it, vi, beforeEach } from "vitest";

const listPurchases = vi.fn();
const purchaseSticker = vi.fn();

vi.mock("@/lib/memory-store", () => ({
  MOCK_SHOPPER_ID: "mock-shopper",
  stickerShopStore: {
    listPurchases: (...args: unknown[]) => listPurchases(...args),
    purchaseSticker: (...args: unknown[]) => purchaseSticker(...args),
  },
}));

const { GET, POST } = await import("./route");

function postRequest(body: unknown) {
  return new Request("http://localhost/api/purchases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/purchases", () => {
  beforeEach(() => {
    listPurchases.mockReset();
    purchaseSticker.mockReset();
  });

  it("returns populated purchase history", async () => {
    listPurchases.mockResolvedValue([
      { id: "p1", stickerId: "s1", stickerName: "Test", price: 10, purchasedAt: "2024-01-01T00:00:00.000Z" },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.purchases).toHaveLength(1);
  });

  it("returns an empty history without an error", async () => {
    listPurchases.mockResolvedValue([]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.purchases).toEqual([]);
  });
});

describe("POST /api/purchases", () => {
  beforeEach(() => {
    listPurchases.mockReset();
    purchaseSticker.mockReset();
  });

  it("returns 201 and the purchase on success", async () => {
    purchaseSticker.mockResolvedValue({
      outcome: "success",
      purchase: { id: "p1", stickerId: "s1", stickerName: "Test", price: 10, purchasedAt: "2024-01-01T00:00:00.000Z" },
      balance: { shopperId: "mock-shopper", credits: 30 },
    });

    const res = await POST(postRequest({ stickerId: "s1" }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.purchase.stickerId).toBe("s1");
    expect(body.balance.credits).toBe(30);
  });

  it("returns 409 with an insufficient-credits message", async () => {
    purchaseSticker.mockResolvedValue({
      outcome: "insufficient_credits",
      balance: { shopperId: "mock-shopper", credits: 5 },
      sticker: { id: "s1", name: "Test", price: 10, imageUrl: "/x.svg" },
    });

    const res = await POST(postRequest({ stickerId: "s1" }));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("insufficient_credits");
  });

  it("returns 409 with an unavailable message", async () => {
    purchaseSticker.mockResolvedValue({ outcome: "unavailable" });

    const res = await POST(postRequest({ stickerId: "does-not-exist" }));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("unavailable");
  });

  it("returns a distinct 500 message on unexpected failure", async () => {
    purchaseSticker.mockRejectedValue(new Error("boom"));

    const res = await POST(postRequest({ stickerId: "s1" }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("purchase_failed");
    expect(body.message).not.toBe("insufficient_credits");
  });

  it("returns 400 when stickerId is missing", async () => {
    const res = await POST(postRequest({}));

    expect(res.status).toBe(400);
    expect(purchaseSticker).not.toHaveBeenCalled();
  });
});
