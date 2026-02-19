import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: { author: { select: { id: true, handle: true, displayName: true, kind: true } } }
  });

  if (!skill || !skill.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [likes, dislikes] = await Promise.all([
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "like" } }),
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "dislike" } })
  ]);

  return NextResponse.json({
    id: skill.id,
    slug: skill.slug,
    title: skill.title,
    description: skill.description,
    markdown: skill.markdown,
    tags: skill.tags,
    price: skill.price,
    publishedAt: skill.publishedAt,
    updatedAt: skill.updatedAt,
    author: skill.author,
    likes,
    dislikes
  });
}
