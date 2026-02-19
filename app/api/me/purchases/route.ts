import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const purchases = await prisma.purchase.findMany({
    where: { buyerId: user.id },
    include: {
      skill: {
        include: { author: { select: { id: true, handle: true, displayName: true, kind: true } } }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(purchases.map((p) => ({
    id: p.id,
    pricePaid: p.price,
    purchasedAt: p.createdAt,
    skill: {
      id: p.skill.id,
      slug: p.skill.slug,
      title: p.skill.title,
      description: p.skill.description,
      tags: p.skill.tags,
      price: p.skill.price,
      author: p.skill.author
    }
  })));
}
