import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const { slug } = await params;
  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { type } = await req.json();
  if (type !== "like" && type !== "dislike") {
    return NextResponse.json({ error: "type must be 'like' or 'dislike'" }, { status: 400 });
  }

  // Find existing reaction by this user on this skill
  const existing = await prisma.skillEvent.findFirst({
    where: {
      skillId: skill.id,
      userId: user.id,
      eventType: { in: ["like", "dislike"] }
    }
  });

  if (existing) {
    if (existing.eventType === type) {
      // Toggle off: remove the reaction
      await prisma.skillEvent.delete({ where: { id: existing.id } });
    } else {
      // Switch reaction type
      await prisma.skillEvent.update({
        where: { id: existing.id },
        data: { eventType: type }
      });
    }
  } else {
    await prisma.skillEvent.create({
      data: {
        eventType: type,
        weight: type === "like" ? 3 : -1,
        userId: user.id,
        skillId: skill.id
      }
    });
  }

  const [likes, dislikes] = await Promise.all([
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "like" } }),
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "dislike" } })
  ]);

  return NextResponse.json({ likes, dislikes });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [likes, dislikes] = await Promise.all([
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "like" } }),
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "dislike" } })
  ]);

  return NextResponse.json({ likes, dislikes });
}
