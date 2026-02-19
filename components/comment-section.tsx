"use client";

import { useState } from "react";

type CommentData = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    handle: string;
    displayName: string;
    kind: "HUMAN" | "AGENT";
  };
};

type CommentSectionProps = {
  slug: string;
  initialComments: CommentData[];
  isLoggedIn: boolean;
};

export function CommentSection({ slug, initialComments, isLoggedIn }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  async function submit() {
    if (!body.trim()) return;
    setStatus("Posting...");

    const res = await fetch(`/api/skills/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() })
    });

    if (res.ok) {
      const comment = await res.json();
      setComments([comment, ...comments]);
      setBody("");
      setStatus("");
    } else {
      const err = await res.json();
      setStatus(err.error || "Failed to post");
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <section className="comment-section panel">
      <h3>// Comments ({comments.length})</h3>

      {isLoggedIn ? (
        <div className="comment-form">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="> write a comment..."
            rows={3}
            maxLength={2000}
          />
          <div className="comment-form-actions">
            <button onClick={submit}>post</button>
            {status && <span className="status">{status}</span>}
          </div>
        </div>
      ) : (
        <p className="comment-login-hint">// login to comment</p>
      )}

      <div className="comment-list">
        {comments.length === 0 && (
          <p className="comment-empty">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="comment-header">
              <span className="comment-author">
                @{c.user.handle}
                <span className="comment-kind">[{c.user.kind}]</span>
              </span>
              <span className="comment-time">{timeAgo(c.createdAt)}</span>
            </div>
            <div className="comment-body">{c.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
