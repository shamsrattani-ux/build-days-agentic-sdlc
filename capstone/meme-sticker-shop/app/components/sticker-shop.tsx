"use client";

import { useCallback, useEffect, useState } from "react";
import type { Purchase, ShopperBalance, Sticker } from "@/lib/types";
import styles from "./sticker-shop.module.css";

type Load<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; data: T };

type PurchaseBanner = { kind: "success" | "error"; text: string } | null;

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Client-side sticker shop: browse the catalog, view the current balance,
 * purchase a sticker, and view purchase history (spec.md "Browse the
 * sticker catalog", "View current credit balance", "Purchase a sticker
 * with virtual credits", "View purchase history"). All data comes from the
 * `/api/*` route handlers; this component owns no storage of its own.
 */
export default function StickerShop() {
  const [stickers, setStickers] = useState<Load<Sticker[]>>({ status: "loading" });
  const [balance, setBalance] = useState<Load<ShopperBalance>>({ status: "loading" });
  const [purchases, setPurchases] = useState<Load<Purchase[]>>({ status: "loading" });
  const [banner, setBanner] = useState<PurchaseBanner>(null);
  const [pendingStickerId, setPendingStickerId] = useState<string | null>(null);

  // Data-fetching effect: each loader is defined inline (not exposed via
  // useCallback) since they are only ever invoked here, on mount. Following
  // the React-recommended fetch-in-effect pattern (setState only after an
  // `await`, guarded by an `ignore` flag) keeps this compliant with
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    let ignore = false;

    async function loadStickers() {
      try {
        const res = await fetch("/api/stickers");
        const body = (await readJson(res)) as { stickers?: Sticker[]; message?: string } | null;
        if (ignore) return;
        if (!res.ok || !body) {
          setStickers({ status: "error", message: body?.message ?? "We couldn't load the stickers. Please try again." });
          return;
        }
        setStickers({ status: "loaded", data: body.stickers ?? [] });
      } catch {
        if (!ignore) {
          setStickers({ status: "error", message: "We couldn't load the stickers. Please try again." });
        }
      }
    }

    async function loadBalance() {
      try {
        const res = await fetch("/api/balance");
        const body = (await readJson(res)) as { balance?: ShopperBalance; message?: string } | null;
        if (ignore) return;
        if (!res.ok || !body?.balance) {
          setBalance({ status: "error", message: body?.message ?? "We couldn't load your balance. Please try again." });
          return;
        }
        setBalance({ status: "loaded", data: body.balance });
      } catch {
        if (!ignore) {
          setBalance({ status: "error", message: "We couldn't load your balance. Please try again." });
        }
      }
    }

    async function loadPurchases() {
      try {
        const res = await fetch("/api/purchases");
        const body = (await readJson(res)) as { purchases?: Purchase[]; message?: string } | null;
        if (ignore) return;
        if (!res.ok || !body) {
          setPurchases({ status: "error", message: body?.message ?? "We couldn't load your purchase history. Please try again." });
          return;
        }
        setPurchases({ status: "loaded", data: body.purchases ?? [] });
      } catch {
        if (!ignore) {
          setPurchases({ status: "error", message: "We couldn't load your purchase history. Please try again." });
        }
      }
    }

    void loadStickers();
    void loadBalance();
    void loadPurchases();

    return () => {
      ignore = true;
    };
  }, []);

  const handlePurchase = useCallback(
    async (sticker: Sticker) => {
      setBanner(null);
      setPendingStickerId(sticker.id);
      try {
        const res = await fetch("/api/purchases", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stickerId: sticker.id }),
        });
        const body = (await readJson(res)) as
          | { purchase?: Purchase; balance?: ShopperBalance; error?: string; message?: string }
          | null;

        if (res.ok && body?.balance && body.purchase) {
          setBanner({ kind: "success", text: `Purchased ${sticker.name} for ${sticker.price} credits.` });
          setBalance({ status: "loaded", data: body.balance });
          setStickers((prev) =>
            prev.status === "loaded" ? { status: "loaded", data: prev.data.filter((s) => s.id !== sticker.id) } : prev,
          );
          setPurchases((prev) =>
            prev.status === "loaded" ? { status: "loaded", data: [...prev.data, body.purchase as Purchase] } : prev,
          );
          return;
        }

        const fallback = "The purchase could not be completed. Please try again.";
        setBanner({ kind: "error", text: body?.message ?? fallback });
      } catch {
        setBanner({ kind: "error", text: "The purchase could not be completed. Please try again." });
      } finally {
        setPendingStickerId(null);
      }
    },
    [],
  );

  return (
    <div className={styles.shop}>
      <header className={styles.header}>
        <h1>Meme Sticker Shop</h1>
        <BalanceDisplay balance={balance} />
      </header>

      {banner && (
        <p role={banner.kind === "error" ? "alert" : "status"} className={banner.kind === "error" ? styles.bannerError : styles.bannerSuccess}>
          {banner.text}
        </p>
      )}

      <section aria-labelledby="catalog-heading">
        <h2 id="catalog-heading">Stickers</h2>
        <StickerGrid stickers={stickers} pendingStickerId={pendingStickerId} onPurchase={handlePurchase} />
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Purchase history</h2>
        <PurchaseHistory purchases={purchases} />
      </section>
    </div>
  );
}

function BalanceDisplay({ balance }: { balance: Load<ShopperBalance> }) {
  if (balance.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Loading balance…
      </p>
    );
  }
  if (balance.status === "error") {
    return (
      <p role="alert">{balance.message}</p>
    );
  }
  return <p data-testid="balance">Balance: {balance.data.credits} credits</p>;
}

function StickerGrid({
  stickers,
  pendingStickerId,
  onPurchase,
}: {
  stickers: Load<Sticker[]>;
  pendingStickerId: string | null;
  onPurchase: (sticker: Sticker) => void;
}) {
  if (stickers.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Loading stickers…
      </p>
    );
  }
  if (stickers.status === "error") {
    return <p role="alert">{stickers.message}</p>;
  }
  if (stickers.data.length === 0) {
    return <p role="status">No stickers available right now.</p>;
  }
  return (
    <ul className={styles.grid}>
      {stickers.data.map((sticker) => (
        <li key={sticker.id} className={styles.card}>
          {/* eslint-disable-next-line @next/next/no-img-element -- seeded, local, non-optimized sample images */}
          <img src={sticker.imageUrl} alt={sticker.name} width={96} height={96} />
          <p>{sticker.name}</p>
          <p>{sticker.price} credits</p>
          <button type="button" disabled={pendingStickerId === sticker.id} onClick={() => onPurchase(sticker)}>
            {pendingStickerId === sticker.id ? "Purchasing…" : `Buy for ${sticker.price} credits`}
          </button>
        </li>
      ))}
    </ul>
  );
}

function PurchaseHistory({ purchases }: { purchases: Load<Purchase[]> }) {
  if (purchases.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Loading purchase history…
      </p>
    );
  }
  if (purchases.status === "error") {
    return <p role="alert">{purchases.message}</p>;
  }
  if (purchases.data.length === 0) {
    return <p role="status">You haven&apos;t purchased any stickers yet.</p>;
  }
  return (
    <ul>
      {purchases.data.map((purchase) => (
        <li key={purchase.id}>
          {purchase.stickerName} — {purchase.price} credits
        </li>
      ))}
    </ul>
  );
}
