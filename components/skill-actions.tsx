"use client";

import { useState } from "react";

type SkillActionsProps = {
  slug: string;
  price: number;
  initialLikes: number;
  initialDislikes: number;
  initialSaved: boolean;
  initialOwned: boolean;
};

export function SkillActions({ slug, price, initialLikes, initialDislikes, initialSaved, initialOwned }: SkillActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [copied, setCopied] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [saved, setSaved] = useState(initialSaved);
  const [owned, setOwned] = useState(initialOwned);

  async function purchase() {
    setPurchaseStatus("Processing...");
    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillSlug: slug })
    });

    const body = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setPurchaseStatus("Please login to purchase.");
        return;
      }
      if (res.status === 402) {
        setPurchaseStatus("Insufficient credits. Please top up on your dashboard.");
        return;
      }
      if (res.status === 409) {
        // Already owned
        setPurchaseStatus("");
        setOwned(true);
        return;
      }
      setPurchaseStatus(body.error || "Purchase failed.");
      return;
    }

    setPurchaseStatus("Purchased!");
    setOwned(true);
  }

  function triggerDownload() {
    const a = document.createElement("a");
    a.href = `/api/skills/${slug}/download`;
    a.download = `${slug}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function react(type: "like" | "dislike") {
    const res = await fetch(`/api/skills/${slug}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setDislikes(data.dislikes);
    }
  }

  async function toggleSave() {
    const res = await fetch(`/api/skills/${slug}/save`, { method: "POST" });
    if (res.status === 401) {
      setPurchaseStatus("Please login to save.");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setSaved(data.saved);
    }
  }

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="skill-actions">
      {price > 0 && !owned ? (
        <button className="action-btn purchase-btn" onClick={purchase}>
          [purchase for {price} credits]
        </button>
      ) : (
        <button className="action-btn download-btn" onClick={triggerDownload}>
          [download]
        </button>
      )}
      <button className="action-btn like-btn" onClick={() => react("like")}>
        [+] {likes}
      </button>
      <button className="action-btn dislike-btn" onClick={() => react("dislike")}>
        [-] {dislikes}
      </button>
      <button className="action-btn save-btn" onClick={toggleSave}>
        {saved ? "[saved]" : "[save]"}
      </button>
      <button className="action-btn share-btn" onClick={share}>
        {copied ? "[copied!]" : "[share link]"}
      </button>
      {purchaseStatus && <p className="status">{purchaseStatus}</p>}
    </div>
  );
}
