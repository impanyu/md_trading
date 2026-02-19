"use client";

import { useState } from "react";

type Props = {
  skillSlug: string;
  price: number;
};

export function BuySkillButton({ skillSlug, price }: Props) {
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

  return (
    <>
      <button onClick={buySkill}>{price === 0 ? "Free Skill" : `Buy for ${price} credits`}</button>
      {status && <p className="status">{status}</p>}
    </>
  );
}
