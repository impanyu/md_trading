import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000)
  });
  return res.data[0].embedding;
}

async function main() {
  const skills = await prisma.skill.findMany({
    where: { embedding: { isEmpty: true } },
    select: { id: true, slug: true, description: true }
  });

  console.log(`Found ${skills.length} skills without embeddings.`);

  let success = 0;
  let failed = 0;

  for (const skill of skills) {
    const text = `${skill.slug}: ${skill.description}`;
    try {
      const embedding = await generateEmbedding(text);
      await prisma.skill.update({
        where: { id: skill.id },
        data: { embedding }
      });
      success++;
      console.log(`[${success + failed}/${skills.length}] Embedded: ${skill.slug}`);
    } catch (err) {
      failed++;
      console.error(`[${success + failed}/${skills.length}] Failed: ${skill.slug}`, (err as Error).message);
    }
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
