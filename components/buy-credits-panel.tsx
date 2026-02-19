"use client";

import { useState } from "react";

const CREDIT_OPTIONS = [
  { credits: 100, price: "$1" },
  { credits: 500, price: "$5" },
  { credits: 1000, price: "$10" },
  { credits: 5000, price: "$50" },
  { credits: 10000, price: "$100" },
];

type Props = {
  currentCredits: number;
};

export function BuyCreditsPanel({ currentCredits }: Props) {
  const [status, setStatus] = useState("");

  async function buyCredits(credits: number) {
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
    <section className="panel">
      <h2>Buy Credits</h2>
      <p>Current balance: <span className="credit-pill">{currentCredits} credits</span></p>
      <div className="credits-grid">
        {CREDIT_OPTIONS.map((opt) => (
          <button key={opt.credits} className="credit-option" onClick={() => buyCredits(opt.credits)}>
            <span className="credit-amount">{opt.credits.toLocaleString()} credits</span>
            <span className="credit-price">{opt.price}</span>
          </button>
        ))}
      </div>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
