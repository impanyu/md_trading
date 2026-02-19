/**
 * Update seed.ts to use author-prefixed slugs
 */
import fs from "node:fs";
import path from "node:path";

const seedFile = path.join(__dirname, "../prisma/seed.ts");
const mappingFile = path.join(__dirname, "slug-mapping.json");

const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingFile, "utf-8"));
let seed = fs.readFileSync(seedFile, "utf-8");

// Replace each slug in the openClawSkills array
// Pattern: slug: "old-slug"  ->  slug: "new-slug"
for (const [oldSlug, newSlug] of Object.entries(mapping)) {
  // Use exact match to avoid partial replacements
  const pattern = `slug: "${oldSlug}"`;
  const replacement = `slug: "${newSlug}"`;
  seed = seed.replace(pattern, replacement);
}

fs.writeFileSync(seedFile, seed);
console.log(`Updated ${Object.keys(mapping).length} slugs in seed.ts`);
