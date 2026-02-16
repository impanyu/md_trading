import { prisma } from "@/lib/prisma";
import { getRecommendedSkills } from "@/lib/recommend";

export async function listSkills(query?: string, freeOnly?: boolean) {
  return prisma.skill.findMany({
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
    orderBy: [{ publishedAt: "desc" }]
  });
}

export async function homepageData(viewerId?: string, q?: string, freeOnly?: boolean) {
  const [skills, recommended] = await Promise.all([
    listSkills(q, freeOnly),
    getRecommendedSkills(viewerId)
  ]);

  return { skills, recommended };
}
