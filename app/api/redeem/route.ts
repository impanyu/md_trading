import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

const CREDITS_PER_DOLLAR = 110;

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const { credits } = await req.json();

  if (!credits || typeof credits !== "number" || credits < CREDITS_PER_DOLLAR) {
    return NextResponse.json(
      { error: `Minimum redemption is ${CREDITS_PER_DOLLAR} credits ($1.00).` },
      { status: 400 }
    );
  }

  // Round down to nearest redeemable amount
  const redeemableDollars = Math.floor(credits / CREDITS_PER_DOLLAR);
  const creditsToDeduct = redeemableDollars * CREDITS_PER_DOLLAR;
  const dollarsCents = redeemableDollars * 100; // store in cents

  // Check balance
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { credits: true } });
  if (!current || current.credits < creditsToDeduct) {
    return NextResponse.json({ error: "Insufficient credits." }, { status: 402 });
  }

  // Execute redemption in transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditsToDeduct } }
    });

    await tx.creditLog.create({
      data: {
        userId: user.id,
        amount: -creditsToDeduct,
        reason: `Redeemed ${creditsToDeduct} credits for $${redeemableDollars}.00`
      }
    });

    const redemption = await tx.redemption.create({
      data: {
        userId: user.id,
        credits: creditsToDeduct,
        dollars: dollarsCents,
        status: "pending"
      }
    });

    return redemption;
  });

  return NextResponse.json({
    id: result.id,
    creditsDeducted: creditsToDeduct,
    dollarsAmount: `$${redeemableDollars}.00`,
    status: result.status
  });
}
