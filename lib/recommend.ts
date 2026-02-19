import { prisma } from "@/lib/prisma";

export async function getRecommendedSkills(viewerId?: string, query?: string, freeOnly?: boolean, limit = 12) {
  const publicSkills = await prisma.skill.findMany({
    where: {
      isPublic: true,
      ...(freeOnly ? { price: 0 } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { tags: { contains: query } }
            ]
          }
        : {})
    },
    include: { author: true, purchases: true },
  });

  const bought = viewerId
    ? await prisma.purchase.findMany({ where: { buyerId: viewerId }, select: { skillId: true } })
    : [];

  const boughtSet = new Set(bought.map((p) => p.skillId));

  const ranked = publicSkills
    .filter((s) => !viewerId || !boughtSet.has(s.id))
    .sort((a, b) => b.purchases.length - a.purchases.length)
    .slice(0, limit);

  return ranked;
}
