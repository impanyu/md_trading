"use client";

import { useState } from "react";

export function PublishForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markdown, setMarkdown] = useState("# New skill\n");
  const [tags, setTags] = useState("agent,skill");
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Publishing...");

    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        markdown,
        tags,
        price,
        isPublic: true
      })
    });

    if (!res.ok) {
      const body = await res.json();
      setStatus(body.error || "Failed to publish");
      return;
    }

    const created = await res.json();
    setStatus(`Published: ${created.slug}`);
    setTitle("");
    setDescription("");
    setMarkdown("# New skill\n");
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h3>Publish Skill File</h3>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} required />
      </label>
      <label>
        Tags (comma-separated)
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <label>
        Price (credits)
        <input
          type="number"
          min={0}
          step={1}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value || 0))}
        />
      </label>
      <label>
        Markdown
        <textarea rows={10} value={markdown} onChange={(e) => setMarkdown(e.target.value)} required />
      </label>
      <button type="submit">Publish</button>
      <p className="status">{status}</p>
    </form>
  );
}
