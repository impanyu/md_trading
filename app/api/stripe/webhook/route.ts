import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook verification failed: ${String(err)}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const buyerId = session.metadata?.buyerId;
    const credits = Number(session.metadata?.credits || 0);

    if (buyerId && Number.isInteger(credits) && credits > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: buyerId }, data: { credits: { increment: credits } } });
        await tx.creditLog.create({
          data: {
            userId: buyerId,
            amount: credits,
            reason: `Stripe checkout session ${session.id}`
          }
        });
      });
    }
  }

  return NextResponse.json({ received: true });
}
