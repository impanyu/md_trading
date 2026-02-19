/**
 * Fetch all files for each skill directory from GitHub and create zip bundles.
 * Stores zips in public/downloads/{slug}.zip
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const URLS_FILE = path.join(__dirname, "skill-urls.json");
const OUTPUT_DIR = path.join(__dirname, "../public/downloads");
const CONCURRENCY = 2;

// skill-urls.json maps slug -> raw URL for SKILL.md
// From the URL we can derive the GitHub API path for the directory
const urls: Record<string, string> = JSON.parse(fs.readFileSync(URLS_FILE, "utf-8"));

// Extract author and slug from raw URL:
// https://raw.githubusercontent.com/openclaw/skills/main/skills/{author}/{slug}/SKILL.md
function parseUrl(url: string): { author: string; slug: string } | null {
  const match = url.match(/\/skills\/([^/]+)\/([^/]+)\/SKILL\.md$/);
  return match ? { author: match[1], slug: match[2] } : null;
}

// GitHub API URL to list directory contents
function apiUrl(author: string, slug: string): string {
  return `https://api.github.com/repos/openclaw/skills/contents/skills/${author}/${slug}`;
}

// Raw file URL
function rawUrl(filePath: string): string {
  return `https://raw.githubusercontent.com/openclaw/skills/main/${filePath}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": "md-trading-bot", Accept: "application/vnd.github.v3+json" }
  });
  if (!res.ok) {
    if (res.status === 403) {
      // Rate limited - wait and retry
      const reset = res.headers.get("x-ratelimit-reset");
      if (reset) {
        const waitMs = (parseInt(reset) * 1000 - Date.now()) + 1000;
        if (waitMs > 0 && waitMs < 120000) {
          console.log(`\n  Rate limited, waiting ${Math.ceil(waitMs / 1000)}s...`);
          await new Promise(r => setTimeout(r, waitMs));
          return fetchJson(url);
        }
      }
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

async function fetchFile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function processSkill(slug: string, url: string): Promise<boolean> {
  const parsed = parseUrl(url);
  if (!parsed) return false;

  const zipPath = path.join(OUTPUT_DIR, `${slug}.zip`);
  if (fs.existsSync(zipPath)) return true; // already done

  const tmpDir = path.join(OUTPUT_DIR, `_tmp_${slug}`);
  const skillDir = path.join(tmpDir, slug);
  fs.mkdirSync(skillDir, { recursive: true });

  try {
    // List directory contents via GitHub API
    const listing = await fetchJson(apiUrl(parsed.author, parsed.slug)) as Array<{
      name: string; path: string; type: string; download_url: string | null;
    }>;

    if (!Array.isArray(listing)) {
      console.log(`\n  [WARN] ${slug}: unexpected API response`);
      return false;
    }

    // Download each file (skip subdirectories for now)
    for (const item of listing) {
      if (item.type === "file" && item.download_url) {
        const content = await fetchFile(item.download_url);
        if (content) {
          fs.writeFileSync(path.join(skillDir, item.name), content);
        }
      }
    }

    // Create zip
    execSync(`cd "${tmpDir}" && zip -r "${zipPath}" "${slug}"`, { stdio: "pipe" });

    // Cleanup tmp
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return true;
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`\n  [ERR] ${slug}: ${err}`);
    return false;
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = Object.entries(urls);
  console.log(`Fetching skill bundles for ${entries.length} skills...`);

  let done = 0;
  let ok = 0;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async ([slug, url]) => {
        const success = await processSkill(slug, url);
        done++;
        process.stdout.write(`\r  [${done}/${entries.length}] ${success ? "OK" : "FAIL"} ${slug}`.padEnd(80));
        return success;
      })
    );
    ok += results.filter(Boolean).length;

    // Small delay to avoid GitHub rate limiting
    if (i + CONCURRENCY < entries.length) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\n\nDone: ${ok}/${entries.length} skill bundles created in ${OUTPUT_DIR}`);
}

main();
