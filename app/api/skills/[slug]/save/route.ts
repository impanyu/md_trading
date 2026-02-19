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

  const existing = await prisma.skillEvent.findFirst({
    where: {
      skillId: skill.id,
      userId: user.id,
      eventType: "save"
    }
  });

  if (existing) {
    await prisma.skillEvent.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.skillEvent.create({
    data: {
      eventType: "save",
      weight: 2,
      userId: user.id,
      skillId: skill.id
    }
  });

  return NextResponse.json({ saved: true });
}
