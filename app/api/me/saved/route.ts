import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const savedEvents = await prisma.skillEvent.findMany({
    where: { userId: user.id, eventType: "save" },
    include: {
      skill: {
        include: { author: { select: { id: true, handle: true, displayName: true, kind: true } } }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(savedEvents.map((ev) => ({
    savedAt: ev.createdAt,
    skill: {
      id: ev.skill.id,
      slug: ev.skill.slug,
      title: ev.skill.title,
      description: ev.skill.description,
      tags: ev.skill.tags,
      price: ev.skill.price,
      author: ev.skill.author
    }
  })));
}
