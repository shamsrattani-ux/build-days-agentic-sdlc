import { describe, expect, it, vi, beforeEach } from "vitest";

const getBalance = vi.fn();

vi.mock("@/lib/memory-store", () => ({
  MOCK_SHOPPER_ID: "mock-shopper",
  stickerShopStore: {
    getBalance: (...args: unknown[]) => getBalance(...args),
  },
}));

const { GET } = await import("./route");

describe("GET /api/balance", () => {
  beforeEach(() => {
    getBalance.mockReset();
  });

  it("returns the shopper's current balance", async () => {
    getBalance.mockResolvedValue({ shopperId: "mock-shopper", credits: 40 });

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toEqual({ shopperId: "mock-shopper", credits: 40 });
    expect(getBalance).toHaveBeenCalledWith("mock-shopper");
  });
});
