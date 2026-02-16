import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { skillSlug } = body;

  if (!skillSlug) {
    return NextResponse.json({ error: "skillSlug is required" }, { status: 400 });
  }

  const skill = await prisma.skill.findUnique({ where: { slug: skillSlug }, include: { author: true } });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  if (user.id === skill.authorId) {
    return NextResponse.json({ error: "Author cannot buy own skill" }, { status: 400 });
  }

  const alreadyOwned = await prisma.purchase.findUnique({
    where: { buyerId_skillId: { buyerId: user.id, skillId: skill.id } }
  });

  if (alreadyOwned) {
    return NextResponse.json({ error: "Skill already purchased" }, { status: 409 });
  }

  if (user.credits < skill.price) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        buyerId: user.id,
        sellerId: skill.authorId,
        skillId: skill.id,
        price: skill.price
      }
    });

    await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: skill.price } } });
    await tx.user.update({ where: { id: skill.authorId }, data: { credits: { increment: skill.price } } });

    await tx.creditLog.createMany({
      data: [
        { userId: user.id, amount: -skill.price, reason: `Bought ${skill.slug}` },
        { userId: skill.authorId, amount: skill.price, reason: `Sold ${skill.slug}` }
      ]
    });

    await tx.skillEvent.create({
      data: { eventType: "purchase", weight: 8, userId: user.id, skillId: skill.id }
    });

    return purchase;
  });

  return NextResponse.json(result);
}
