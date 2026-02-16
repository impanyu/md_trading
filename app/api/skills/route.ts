import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const freeOnly = searchParams.get("free") === "1";
  const tag = searchParams.get("tag")?.trim();

  const skills = await prisma.skill.findMany({
    where: {
      isPublic: true,
      ...(freeOnly ? { price: 0 } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { tags: { contains: q } }
            ]
          }
        : {}),
      ...(tag ? { tags: { contains: tag } } : {})
    },
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

  const skill = await prisma.skill.create({
    data: {
      slug: `${slugBase}-${suffix}`,
      title: body.title,
      description: body.description,
      markdown: body.markdown,
      tags: body.tags ?? "",
      isPublic: body.isPublic ?? true,
      price: Number.isInteger(body.price) ? body.price : 0,
      authorId: user.id
    },
    include: { author: true }
  });

  return NextResponse.json(skill, { status: 201 });
}
