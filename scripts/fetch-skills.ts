import fs from "node:fs";
import path from "node:path";

const URLS_FILE = path.join(__dirname, "skill-urls.json");
const OUTPUT_FILE = path.join(__dirname, "skill-contents.json");

const CONCURRENCY = 10;

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
      console.warn(`  [${res.status}] ${url} (retry ${i + 1})`);
    } catch (err) {
      console.warn(`  [error] ${url} (retry ${i + 1}): ${err}`);
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return null;
}

async function main() {
  const urls: Record<string, string> = JSON.parse(fs.readFileSync(URLS_FILE, "utf-8"));
  const slugs = Object.keys(urls);
  console.log(`Fetching ${slugs.length} skill files...`);

  const results: Record<string, string> = {};
  let done = 0;

  // Process in batches
  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (slug) => {
      const content = await fetchWithRetry(urls[slug]);
      done++;
      if (content) {
        results[slug] = content;
        process.stdout.write(`\r  [${done}/${slugs.length}] ${slug} - OK`);
      } else {
        process.stdout.write(`\r  [${done}/${slugs.length}] ${slug} - MISSING`);
      }
    });
    await Promise.all(promises);
  }

  console.log(`\n\nFetched ${Object.keys(results).length}/${slugs.length} skill files.`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main();
