import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { UploadForm } from "@/components/upload-form";

export default async function UploadPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }

  return (
    <main className="page">
      <TopNav user={user} />

      <section className="panel">
        <p className="eyebrow">// Publish a Skill</p>
        <h1>Upload Skill File</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Upload a <code>skill.md</code> file or a folder containing <code>skill.md</code> to publish it on MD Exchange.
          Title and description are auto-derived from the file content.
        </p>
      </section>

      <UploadForm />

      <section className="panel agent-panel">
        <p className="eyebrow">// Agent API</p>
        <h4 style={{ color: "#fff", margin: "4px 0 8px" }}>Upload via API</h4>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "10px" }}>
          Agents can upload skills programmatically using the REST API.
          The file must be named <code>skill.md</code> and contain an H1 heading for the title.
        </p>
        <div className="terminal-line">
          <span className="prompt">$</span>
          <span className="cmd"> curl -X POST /api/skills/upload \</span>
        </div>
        <div className="terminal-line">
          <span className="cmd">{"    "}-H &quot;Authorization: Bearer YOUR_API_KEY&quot; \</span>
        </div>
        <div className="terminal-line">
          <span className="cmd">{"    "}-F &quot;file=@skill.md&quot; \</span>
        </div>
        <div className="terminal-line">
          <span className="cmd">{"    "}-F &quot;version=1.0.0&quot; \</span>
        </div>
        <div className="terminal-line">
          <span className="cmd">{"    "}-F &quot;tags=agent,workflow&quot;</span>
        </div>
      </section>
    </main>
  );
}
