import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StickerShop from "./sticker-shop";

const STICKER = { id: "sticker-doge", name: "Classic Doge", price: 10, imageUrl: "/stickers/doge.svg" };
const BALANCE = { shopperId: "mock-shopper", credits: 40 };

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const ok = init.ok ?? true;
  return {
    ok,
    status: init.status ?? (ok ? 200 : 500),
    json: async () => body,
  } as Response;
}

function mockFetchSequence(handlers: Record<string, () => Response | Promise<Response>>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();
    const key = `${method} ${url}`;
    const handler = handlers[key];
    if (!handler) throw new Error(`Unhandled fetch: ${key}`);
    return handler();
  });
}

describe("StickerShop", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows loading states before data arrives", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    render(<StickerShop />);

    expect(screen.getByText(/loading stickers/i)).toBeInTheDocument();
    expect(screen.getByText(/loading balance/i)).toBeInTheDocument();
    expect(screen.getByText(/loading purchase history/i)).toBeInTheDocument();
  });

  it("shows the populated catalog, balance, and empty purchase history", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [STICKER] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
      }),
    );

    render(<StickerShop />);

    expect(await screen.findByText("Classic Doge")).toBeInTheDocument();
    expect(screen.getByTestId("balance")).toHaveTextContent("Balance: 40 credits");
    expect(screen.getByText(/haven't purchased any stickers yet/i)).toBeInTheDocument();
  });

  it("shows an empty-catalog message when no stickers remain", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
      }),
    );

    render(<StickerShop />);

    expect(await screen.findByText(/no stickers available right now/i)).toBeInTheDocument();
  });

  it("shows a failure message when the catalog request fails", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ error: "catalog_unavailable", message: "boom" }, { ok: false, status: 500 }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
      }),
    );

    render(<StickerShop />);

    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("shows populated purchase history", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () =>
          jsonResponse({ purchases: [{ id: "p1", stickerId: "s1", stickerName: "Confused Cat", price: 15, purchasedAt: "2024-01-01T00:00:00.000Z" }] }),
      }),
    );

    render(<StickerShop />);

    const history = await screen.findByText(/Confused Cat/);
    expect(history).toBeInTheDocument();
  });

  it("updates the balance and moves the sticker out of the grid after a successful purchase", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [STICKER] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
        "POST /api/purchases": () =>
          jsonResponse(
            {
              purchase: { id: "p1", stickerId: STICKER.id, stickerName: STICKER.name, price: STICKER.price, purchasedAt: "2024-01-01T00:00:00.000Z" },
              balance: { shopperId: "mock-shopper", credits: 30 },
            },
            { status: 201 },
          ),
      }),
    );

    render(<StickerShop />);
    const button = await screen.findByRole("button", { name: /buy for 10 credits/i });
    await user.click(button);

    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("Balance: 30 credits"));
    expect(screen.queryByText("Classic Doge")).not.toBeInTheDocument();
    expect(await screen.findByText(/purchased classic doge/i)).toBeInTheDocument();
  });

  it("shows a distinct message when a purchase fails for insufficient credits", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [STICKER] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
        "POST /api/purchases": () =>
          jsonResponse({ error: "insufficient_credits", message: "Your credit balance is too low to purchase this sticker." }, { ok: false, status: 409 }),
      }),
    );

    render(<StickerShop />);
    const button = await screen.findByRole("button", { name: /buy for 10 credits/i });
    await user.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(/too low/i);
  });

  it("shows a distinct message when a purchase fails because the sticker is unavailable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [STICKER] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
        "POST /api/purchases": () => jsonResponse({ error: "unavailable", message: "This sticker is no longer available." }, { ok: false, status: 409 }),
      }),
    );

    render(<StickerShop />);
    const button = await screen.findByRole("button", { name: /buy for 10 credits/i });
    await user.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer available/i);
  });

  it("shows a distinct message on an unexpected purchase failure", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        "GET /api/stickers": () => jsonResponse({ stickers: [STICKER] }),
        "GET /api/balance": () => jsonResponse({ balance: BALANCE }),
        "GET /api/purchases": () => jsonResponse({ purchases: [] }),
        "POST /api/purchases": () =>
          jsonResponse({ error: "purchase_failed", message: "The purchase could not be completed. Please try again." }, { ok: false, status: 500 }),
      }),
    );

    render(<StickerShop />);
    const button = await screen.findByRole("button", { name: /buy for 10 credits/i });
    await user.click(button);

    const alert = await screen.findByRole("alert");
    expect(within(alert).queryByText(/too low/i)).not.toBeInTheDocument();
    expect(alert).toHaveTextContent(/could not be completed/i);
  });
});
