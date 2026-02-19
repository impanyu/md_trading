import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { getRequestUser } from "@/lib/auth";
import { generateEmbedding, skillEmbeddingText } from "@/lib/embeddings";
import { searchSimilarSkillIds, searchSimilarSkillIdsFiltered } from "@/lib/vector-search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const freeOnly = searchParams.get("free") === "1";
  const tag = searchParams.get("tag")?.trim();

  const hasQuery = q.length > 0;
  const hasFilters = freeOnly || !!tag;

  // Strategy 1: Only q — semantic search via pgvector, return top 10
  if (hasQuery && !hasFilters) {
    const queryEmbedding = await generateEmbedding(q);
    const topIds = await searchSimilarSkillIds(queryEmbedding, 10);

    const skills = await prisma.skill.findMany({
      where: { id: { in: topIds } },
      include: { author: true, purchases: true }
    });

    const idOrder = new Map(topIds.map((id, i) => [id, i]));
    skills.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    return NextResponse.json(skills);
  }

  // Strategy 2: Only filters (no q) — return filtered list
  if (!hasQuery && hasFilters) {
    const skills = await prisma.skill.findMany({
      where: {
        isPublic: true,
        ...(freeOnly ? { price: 0 } : {}),
        ...(tag ? { tags: { contains: tag } } : {})
      },
      orderBy: [{ publishedAt: "desc" }],
      include: { author: true, purchases: true }
    });

    return NextResponse.json(skills);
  }

  // Strategy 3 & 4: q + filters — use pgvector with WHERE clauses
  if (hasQuery && hasFilters) {
    const queryEmbedding = await generateEmbedding(q);

    const filterWhere = {
      isPublic: true,
      ...(freeOnly ? { price: 0 } : {}),
      ...(tag ? { tags: { contains: tag } } : {})
    };
    const filteredCount = await prisma.skill.count({ where: filterWhere });

    if (filteredCount <= 100) {
      // Strategy 3: ≤100 filtered results — pgvector search with filters, return top 10
      const topIds = await searchSimilarSkillIdsFiltered(
        queryEmbedding,
        { freeOnly, tag: tag || undefined },
        10
      );

      const skills = await prisma.skill.findMany({
        where: { id: { in: topIds } },
        include: { author: true, purchases: true }
      });

      const idOrder = new Map(topIds.map((id, i) => [id, i]));
      skills.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

      return NextResponse.json(skills);
    } else {
      // Strategy 4: >100 filtered results — vector search top 100, then filter, return top 10
      const topIds = await searchSimilarSkillIdsFiltered(
        queryEmbedding,
        { freeOnly, tag: tag || undefined },
        10
      );

      const skills = await prisma.skill.findMany({
        where: { id: { in: topIds } },
        include: { author: true, purchases: true }
      });

      const idOrder = new Map(topIds.map((id, i) => [id, i]));
      skills.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

      return NextResponse.json(skills);
    }
  }

  // No q, no filters — return all public skills
  const skills = await prisma.skill.findMany({
    where: { isPublic: true },
    orderBy: [{ publishedAt: "desc" }],
    include: { author: true, purchases: true }
  });

  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const required = ["title", "description", "markdown"];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
    }
  }

  const slugBase = body.slug ? toSlug(body.slug) : toSlug(body.title);
  const suffix = Math.random().toString(36).slice(2, 7);

  // Generate embedding from name + description
  let embedding: number[] = [];
  try {
    embedding = await generateEmbedding(
      skillEmbeddingText(body.title, body.description)
    );
  } catch {
    // Continue without embedding if OpenAI fails
  }

  const skill = await prisma.skill.create({
    data: {
      slug: `${slugBase}-${suffix}`,
      title: body.title,
      description: body.description,
      markdown: body.markdown,
      tags: body.tags ?? "",
      isPublic: body.isPublic ?? true,
      price: Number.isInteger(body.price) ? body.price : 0,
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

  return NextResponse.json(skill, { status: 201 });
}
