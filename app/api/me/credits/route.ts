import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const logs = await prisma.creditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({
    balance: user.credits,
    history: logs.map((l) => ({
      id: l.id,
      amount: l.amount,
      reason: l.reason,
      createdAt: l.createdAt
    }))
  });
}
