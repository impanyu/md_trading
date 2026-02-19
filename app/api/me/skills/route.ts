import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const skills = await prisma.skill.findMany({
    where: { authorId: user.id },
    orderBy: { publishedAt: "desc" }
  });

  return NextResponse.json(skills.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    tags: s.tags,
    price: s.price,
    isPublic: s.isPublic,
    publishedAt: s.publishedAt,
    updatedAt: s.updatedAt
  })));
}
