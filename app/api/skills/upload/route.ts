import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { generateEmbedding, skillEmbeddingText } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  // Extract file
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field. Upload a skill.md file." }, { status: 400 });
  }

  // Validate file name is skill.md (case insensitive)
  if (file.name.toLowerCase() !== "skill.md") {
    return NextResponse.json({ error: "File must be named skill.md." }, { status: 400 });
  }

  const markdown = await file.text();
  if (!markdown.trim()) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }

  // Extract metadata from form fields
  const tags = (formData.get("tags") as string)?.trim() || "";
  const priceStr = formData.get("price") as string;
  const price = priceStr ? parseInt(priceStr, 10) || 0 : 0;
  const isPublic = formData.get("isPublic") !== "false";
  const version = (formData.get("version") as string)?.trim() || "1.0.0";

  // Extract slug from frontmatter "name:" field
  const nameMatch = markdown.match(/^name:\s*(.+)$/m);
  if (!nameMatch) {
    return NextResponse.json({ error: "skill.md must contain a 'name:' field." }, { status: 400 });
  }
  const slug = nameMatch[1].trim();
  if (!slug) {
    return NextResponse.json({ error: "The 'name:' field in skill.md must not be empty." }, { status: 400 });
  }

  // Reject duplicate slug
  const existing = await prisma.skill.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Existing skill name found, please rename your skill." }, { status: 409 });
  }

  // Auto-derive title from first H1 heading
  let title = "";
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    title = headingMatch[1].trim();
  }
  if (!title) {
    return NextResponse.json({ error: "skill.md must contain an H1 heading (# Title)." }, { status: 400 });
  }

  // Auto-derive description from frontmatter or first non-heading line
  let description = "";
  const descMatch = markdown.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    description = descMatch[1].trim();
  } else {
    const lines = markdown.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---")) {
        description = trimmed.slice(0, 200);
        break;
      }
    }
  }
  if (!description) {
    description = title;
  }

  // Generate embedding from name + description
  let embedding: number[] = [];
  try {
    embedding = await generateEmbedding(skillEmbeddingText(slug, description));
  } catch {
    // Continue without embedding if OpenAI fails
  }

  const skill = await prisma.skill.create({
    data: {
      slug,
      title,
      description,
      markdown,
      tags,
      version,
      isPublic,
      price,
      embedding,
      authorId: user.id
    },
    include: { author: true }
  });

  // Sync to pgvector column
  if (embedding.length > 0) {
    const vecStr = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      'UPDATE "Skill" SET embedding_vec = $1::vector WHERE id = $2',
      vecStr,
      skill.id
    );
  }

  return NextResponse.json(
    {
      id: skill.id,
      slug: skill.slug,
      title: skill.title,
      description: skill.description,
      version: skill.version,
      tags: skill.tags,
      price: skill.price,
      url: `/skills/${skill.slug}`
    },
    { status: 201 }
  );
}
