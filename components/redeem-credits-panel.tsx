"use client";

import { useState } from "react";

const CREDITS_PER_DOLLAR = 110;

type Props = {
  currentCredits: number;
};

export function RedeemCreditsPanel({ currentCredits }: Props) {
  const [credits, setCredits] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const creditsNum = parseInt(credits, 10) || 0;
  const dollarsOut = Math.floor(creditsNum / CREDITS_PER_DOLLAR);
  const creditsUsed = dollarsOut * CREDITS_PER_DOLLAR;

  async function redeem() {
    if (creditsNum < CREDITS_PER_DOLLAR) {
      setStatus(`Minimum is ${CREDITS_PER_DOLLAR} credits ($1.00).`);
      return;
    }
    if (creditsNum > currentCredits) {
      setStatus("Insufficient credits.");
      return;
    }

    setSubmitting(true);
    setStatus("Processing...");

    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits: creditsNum })
    });

    const body = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setStatus(body.error || "Redemption failed.");
      return;
    }

    setStatus(`Redeemed ${body.creditsDeducted} credits for ${body.dollarsAmount}. Status: ${body.status}`);
    setCredits("");
  }

  return (
    <section className="panel">
      <h2>Redeem Credits</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
        Exchange rate: {CREDITS_PER_DOLLAR} credits = $1.00
      </p>
      <div className="upload-row" style={{ alignItems: "flex-end", gap: "12px" }}>
        <label className="upload-label" style={{ flex: 1 }}>
          <span>Credits to redeem</span>
          <input
            type="number"
            min={CREDITS_PER_DOLLAR}
            max={currentCredits}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            placeholder={String(CREDITS_PER_DOLLAR)}
          />
        </label>
        <button onClick={redeem} disabled={submitting || dollarsOut < 1} style={{ marginBottom: "4px" }}>
          {submitting ? "processing..." : `> redeem for $${dollarsOut}.00`}
        </button>
      </div>
      {creditsNum >= CREDITS_PER_DOLLAR && (
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "6px" }}>
          {creditsUsed} credits will be deducted (remainder {creditsNum - creditsUsed} kept)
        </p>
      )}
      {status && <p className="status">{status}</p>}
    </section>
  );
}
