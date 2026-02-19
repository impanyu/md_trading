"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export function UploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("0");
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function isSkillMd(name: string): boolean {
    return name.toLowerCase() === "skill.md";
  }

  function findSkillMdInFiles(files: FileList): File | null {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parts = file.name.split("/");
      const baseName = parts[parts.length - 1];
      if (isSkillMd(baseName)) return file;
    }
    return null;
  }

  function handleFile(file: File) {
    if (!isSkillMd(file.name)) {
      setStatus("File must be named skill.md (case insensitive).");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMarkdown(content);
      setStatus("");
    };
    reader.readAsText(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const skillFile = findSkillMdInFiles(files);
    if (skillFile) {
      handleFile(skillFile);
    } else {
      setStatus("No skill.md found. The file or folder must contain a skill.md file.");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Check all dropped files for skill.md
    const skillFile = findSkillMdInFiles(files);
    if (skillFile) {
      handleFile(skillFile);
      return;
    }

    // Single file case
    if (files.length === 1) {
      const file = files[0];
      if (isSkillMd(file.name)) {
        handleFile(file);
      } else {
        setStatus("File must be named skill.md (case insensitive).");
      }
    } else {
      setStatus("No skill.md found in the dropped files.");
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  async function submit() {
    if (!markdown.trim()) {
      setStatus("Please upload a skill.md file first.");
      return;
    }

    const versionTrimmed = version.trim();
    if (!versionTrimmed) {
      setStatus("Version is required.");
      return;
    }

    setSubmitting(true);
    setStatus("Publishing...");

    const formData = new FormData();
    const blob = new Blob([markdown], { type: "text/markdown" });
    formData.append("file", blob, "skill.md");
    formData.append("version", versionTrimmed);
    if (tags.trim()) formData.append("tags", tags.trim());
    formData.append("price", String(parseInt(price, 10) || 0));

    const res = await fetch("/api/skills/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setStatus(data.error || "Upload failed.");
      return;
    }

    setStatus("Published!");
    router.push(`/skills/${data.slug}`);
  }

  return (
    <section className="panel upload-panel">
      {/* Drop zone */}
      <div
        className={`drop-zone${dragging ? " dragging" : ""}${fileName ? " has-file" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".md"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        <input
          ref={folderRef}
          type="file"
          {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        {fileName ? (
          <div className="drop-zone-file">
            <span className="drop-zone-icon">[.md]</span>
            <span>{fileName}</span>
            <span className="drop-zone-size">{(markdown.length / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <div className="drop-zone-prompt">
            <span className="drop-zone-icon">[+]</span>
            <span>Drop skill.md file or folder here, or click to browse</span>
          </div>
        )}
      </div>

      {/* Browse folder button */}
      <div style={{ marginTop: "8px", textAlign: "center" }}>
        <button
          className="action-btn"
          onClick={(e) => { e.stopPropagation(); folderRef.current?.click(); }}
          style={{ fontSize: "0.82rem" }}
        >
          [browse folder]
        </button>
      </div>

      {/* Metadata form */}
      <div className="upload-fields">
        <div className="upload-row">
          <label className="upload-label">
            <span>Version *</span>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </label>

          <label className="upload-label upload-price">
            <span>Price (credits)</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        <label className="upload-label">
          <span>Tags</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma-separated, e.g. git,workflow,automation"
          />
        </label>
      </div>

      {/* Preview */}
      {markdown && (
        <details className="upload-preview">
          <summary>Preview markdown ({markdown.split("\n").length} lines)</summary>
          <pre className="upload-preview-content">{markdown.slice(0, 2000)}{markdown.length > 2000 ? "\n..." : ""}</pre>
        </details>
      )}

      {/* Submit */}
      <div className="upload-submit">
        <button onClick={submit} disabled={submitting}>
          {submitting ? "publishing..." : "> publish skill"}
        </button>
        {status && <span className="status">{status}</span>}
      </div>
    </section>
  );
}
