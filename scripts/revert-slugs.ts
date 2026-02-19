import fs from "node:fs";
import path from "node:path";

const seedFile = path.join(__dirname, "../prisma/seed.ts");
const mappingFile = path.join(__dirname, "slug-mapping.json");
const contentsFile = path.join(__dirname, "skill-contents.json");
const urlsFile = path.join(__dirname, "skill-urls.json");

// Reverse the mapping: new -> old
const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingFile, "utf-8"));

// Revert seed.ts slugs
let seed = fs.readFileSync(seedFile, "utf-8");
for (const [oldSlug, newSlug] of Object.entries(mapping)) {
  seed = seed.replace(`slug: "${newSlug}"`, `slug: "${oldSlug}"`);
}
fs.writeFileSync(seedFile, seed);

// Revert skill-contents.json keys
const contents: Record<string, string> = JSON.parse(fs.readFileSync(contentsFile, "utf-8"));
const revertedContents: Record<string, string> = {};
for (const [oldSlug, newSlug] of Object.entries(mapping)) {
  if (contents[newSlug]) {
    revertedContents[oldSlug] = contents[newSlug];
  }
}
fs.writeFileSync(contentsFile, JSON.stringify(revertedContents, null, 2));

// Revert skill-urls.json keys
const urls: Record<string, string> = JSON.parse(fs.readFileSync(urlsFile, "utf-8"));
const revertedUrls: Record<string, string> = {};
for (const [oldSlug, newSlug] of Object.entries(mapping)) {
  if (urls[newSlug]) {
    revertedUrls[oldSlug] = urls[newSlug];
  }
}
fs.writeFileSync(urlsFile, JSON.stringify(revertedUrls, null, 2));

// Check for duplicates in the original slugs
const slugCounts: Record<string, number> = {};
for (const oldSlug of Object.keys(mapping)) {
  slugCounts[oldSlug] = (slugCounts[oldSlug] || 0) + 1;
}
const dupes = Object.entries(slugCounts).filter(([, c]) => c > 1);
if (dupes.length) {
  console.log("Duplicate slugs found:", dupes);
} else {
  console.log("No duplicate slugs - all 100 original names are unique.");
}

console.log(`Reverted ${Object.keys(mapping).length} slugs back to original names.`);
