import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

const priceIdByCredits: Record<number, string | undefined> = {
  100: process.env.STRIPE_PRICE_ID_100_CREDITS,
  500: process.env.STRIPE_PRICE_ID_500_CREDITS
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const body = await req.json();
  const credits = Number(body.credits);

  const buyer = await getRequestUser(req);
  if (!buyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Number.isInteger(credits)) {
    return NextResponse.json({ error: "integer credits required" }, { status: 400 });
  }

  const priceId = priceIdByCredits[credits];
  if (!priceId) {
    return NextResponse.json({ error: "Unsupported credit package" }, { status: 400 });
  }

  const freshBuyer = await prisma.user.findUnique({ where: { id: buyer.id } });
  if (!freshBuyer) return NextResponse.json({ error: "Buyer not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?payment=success`,
    cancel_url: `${appUrl}/?payment=canceled`,
    metadata: {
      buyerId: freshBuyer.id,
      credits: String(credits)
    }
  });

  return NextResponse.json({ url: session.url });
}
