import { prisma } from "@/lib/prisma";

/**
 * Search all public skills by cosine similarity using pgvector.
 * Returns skill IDs ordered by similarity (most similar first).
 */
export async function searchSimilarSkillIds(
  queryEmbedding: number[],
  limit: number
): Promise<string[]> {
  const vecStr = `[${queryEmbedding.join(",")}]`;
  const rows: { id: string }[] = await prisma.$queryRawUnsafe(
    `SELECT id FROM "Skill"
     WHERE "isPublic" = true AND embedding_vec IS NOT NULL
     ORDER BY embedding_vec <=> $1::vector
     LIMIT $2`,
    vecStr,
    limit
  );
  return rows.map((r) => r.id);
}

/**
 * Search skills with free/tag filters using pgvector.
 * Returns skill IDs ordered by similarity.
 */
export async function searchSimilarSkillIdsFiltered(
  queryEmbedding: number[],
  filters: { freeOnly?: boolean; tag?: string },
  limit: number
): Promise<string[]> {
  const vecStr = `[${queryEmbedding.join(",")}]`;
  const conditions = [`"isPublic" = true`, `embedding_vec IS NOT NULL`];
  const params: unknown[] = [vecStr];
  let paramIdx = 2;

  if (filters.freeOnly) {
    conditions.push(`price = 0`);
  }
  if (filters.tag) {
    conditions.push(`tags LIKE '%' || $${paramIdx} || '%'`);
    params.push(filters.tag);
    paramIdx++;
  }

  params.push(limit);
  const limitParam = `$${paramIdx}`;

  const sql = `SELECT id FROM "Skill"
    WHERE ${conditions.join(" AND ")}
    ORDER BY embedding_vec <=> $1::vector
    LIMIT ${limitParam}`;

  const rows: { id: string }[] = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.map((r) => r.id);
}
