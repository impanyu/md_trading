import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const redemptions = await prisma.redemption.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(redemptions.map((r) => ({
    id: r.id,
    credits: r.credits,
    dollars: `$${(r.dollars / 100).toFixed(2)}`,
    status: r.status,
    createdAt: r.createdAt
  })));
}
