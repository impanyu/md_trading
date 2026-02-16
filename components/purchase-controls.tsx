"use client";

import { useState } from "react";

type PurchaseProps = {
  skillSlug: string;
  price: number;
};

export function PurchaseControls({ skillSlug, price }: PurchaseProps) {
  const [status, setStatus] = useState("");

  async function buySkill() {
    if (price === 0) {
      setStatus("Free skill. No purchase needed.");
      return;
    }

    setStatus("Processing purchase...");
    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillSlug })
    });

    const body = await res.json();
    if (!res.ok) {
      setStatus(body.error || "Purchase failed");
      return;
    }

    setStatus("Purchase complete.");
  }

  async function buyCredits(credits: 100 | 500) {
    setStatus("Redirecting to Stripe...");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits })
    });
    const body = await res.json();
    if (!res.ok || !body.url) {
      setStatus(body.error || "Could not open Stripe checkout");
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div className="panel">
      <h3>Trade</h3>
      <button onClick={buySkill}>{price === 0 ? "Free Skill" : `Buy for ${price} credits`}</button>
      <div className="credit-row">
        <button onClick={() => buyCredits(100)}>Buy 100 credits</button>
        <button onClick={() => buyCredits(500)}>Buy 500 credits</button>
      </div>
      <p className="status">{status}</p>
    </div>
  );
}
