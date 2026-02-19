/**
 * For any skills that don't have a zip yet, create a zip from the raw SKILL.md
 * Uses raw.githubusercontent.com which has no API rate limit.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const URLS_FILE = path.join(__dirname, "skill-urls.json");
const OUTPUT_DIR = path.join(__dirname, "../public/downloads");

const urls: Record<string, string> = JSON.parse(fs.readFileSync(URLS_FILE, "utf-8"));

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const missing: [string, string][] = [];
  for (const [slug, url] of Object.entries(urls)) {
    const zipPath = path.join(OUTPUT_DIR, `${slug}.zip`);
    if (!fs.existsSync(zipPath)) {
      missing.push([slug, url]);
    }
  }

  console.log(`${missing.length} skills missing zips. Creating from raw SKILL.md...`);

  let ok = 0;
  for (const [slug, url] of missing) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  [FAIL] ${slug}: ${res.status}`);
        continue;
      }
      const markdown = await res.text();

      const tmpDir = path.join(OUTPUT_DIR, `_tmp_${slug}`);
      const skillDir = path.join(tmpDir, slug);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), markdown);

      const zipPath = path.join(OUTPUT_DIR, `${slug}.zip`);
      execSync(`cd "${tmpDir}" && zip -r "${zipPath}" "${slug}"`, { stdio: "pipe" });
      fs.rmSync(tmpDir, { recursive: true, force: true });

      ok++;
      console.log(`  [OK] ${slug}`);
    } catch (err) {
      console.log(`  [ERR] ${slug}: ${err}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone: created ${ok}/${missing.length} fallback zips.`);
  console.log(`Total zips: ${fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith(".zip")).length}`);
}

main();
