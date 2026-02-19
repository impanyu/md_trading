/**
 * Remap skill slugs to author/slug format and update skill-contents.json
 */
import fs from "node:fs";
import path from "node:path";

const urlsFile = path.join(__dirname, "skill-urls.json");
const contentsFile = path.join(__dirname, "skill-contents.json");

const urls: Record<string, string> = JSON.parse(fs.readFileSync(urlsFile, "utf-8"));
const contents: Record<string, string> = JSON.parse(fs.readFileSync(contentsFile, "utf-8"));

// Extract author from URL: .../skills/{author}/{slug}/SKILL.md
function extractAuthor(url: string): string {
  const match = url.match(/\/skills\/([^/]+)\/[^/]+\/SKILL\.md$/);
  return match ? match[1] : "";
}

// Build new mappings with author/slug keys
const newUrls: Record<string, string> = {};
const newContents: Record<string, string> = {};
const slugMapping: Record<string, string> = {}; // old -> new

for (const [slug, url] of Object.entries(urls)) {
  const author = extractAuthor(url);
  const newSlug = `${author}-${slug}`;
  newUrls[newSlug] = url;
  slugMapping[slug] = newSlug;
  if (contents[slug]) {
    newContents[newSlug] = contents[slug];
  }
}

fs.writeFileSync(urlsFile, JSON.stringify(newUrls, null, 2));
fs.writeFileSync(contentsFile, JSON.stringify(newContents, null, 2));
fs.writeFileSync(path.join(__dirname, "slug-mapping.json"), JSON.stringify(slugMapping, null, 2));

console.log(`Remapped ${Object.keys(slugMapping).length} slugs to author-slug format.`);
console.log("Sample mappings:");
const samples = Object.entries(slugMapping).slice(0, 5);
for (const [old, nw] of samples) {
  console.log(`  ${old} -> ${nw}`);
}
