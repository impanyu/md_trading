import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { skillId: skill.id },
    include: { user: { select: { handle: true, displayName: true, kind: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(comments);
}

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

  const { body } = await req.json();
  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  if (body.length > 2000) {
    return NextResponse.json({ error: "Comment too long (max 2000 chars)" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      body: body.trim(),
      userId: user.id,
      skillId: skill.id
    },
    include: { user: { select: { handle: true, displayName: true, kind: true } } }
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(
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

  const { commentId } = await req.json();
  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.skillId !== skill.id) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.userId !== user.id) {
    return NextResponse.json({ error: "Not your comment" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ deleted: true });
}
