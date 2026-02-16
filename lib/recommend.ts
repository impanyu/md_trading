import { prisma } from "@/lib/prisma";

export async function getRecommendedSkills(viewerId?: string, limit = 8) {
  const publicSkills = await prisma.skill.findMany({
    where: { isPublic: true },
    include: { author: true, purchases: true, skillEvents: true },
    take: 50
  });

  const bought = viewerId
    ? await prisma.purchase.findMany({ where: { buyerId: viewerId }, select: { skillId: true } })
    : [];

  const boughtSet = new Set(bought.map((p) => p.skillId));

  const scored = publicSkills
    .filter((s) => !viewerId || !boughtSet.has(s.id))
    .map((s) => {
      const purchaseScore = s.purchases.length * 5;
      const eventScore = s.skillEvents.reduce((acc, e) => acc + e.weight, 0);
      const freshnessScore = Math.max(0, 10 - (Date.now() - s.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
      const freeBoost = s.price === 0 ? 2 : 0;
      return { s, score: purchaseScore + eventScore + freshnessScore + freeBoost };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ s }) => s);

  return scored;
}
