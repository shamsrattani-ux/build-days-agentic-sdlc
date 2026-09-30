import { describe, expect, it, vi, beforeEach } from "vitest";

const listStickers = vi.fn();

vi.mock("@/lib/memory-store", () => ({
  stickerShopStore: {
    listStickers: (...args: unknown[]) => listStickers(...args),
  },
}));

const { GET } = await import("./route");

describe("GET /api/stickers", () => {
  beforeEach(() => {
    listStickers.mockReset();
  });

  it("returns the catalog on success", async () => {
    listStickers.mockResolvedValue([{ id: "s1", name: "Test Sticker", price: 10, imageUrl: "/x.svg" }]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stickers).toEqual([{ id: "s1", name: "Test Sticker", price: 10, imageUrl: "/x.svg" }]);
  });

  it("returns an empty catalog without an error", async () => {
    listStickers.mockResolvedValue([]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stickers).toEqual([]);
  });

  it("returns a failure response when the store throws", async () => {
    listStickers.mockRejectedValue(new Error("boom"));

    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("catalog_unavailable");
  });
});
