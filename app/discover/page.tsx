import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SkillCard } from "@/components/skill-card";
import { TopNav } from "@/components/top-nav";
import { getSessionUser } from "@/lib/auth";

const PER_PAGE = 20;

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; q?: string; free?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() ?? "";
  const freeOnly = params.free === "1";
  const user = await getSessionUser();

  const where = {
    isPublic: true,
    ...(freeOnly ? { price: 0 } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } }
          ]
        }
      : {})
  };

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: { author: true, purchases: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE
    }),
    prisma.skill.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (q) params.set("q", q);
    if (freeOnly) params.set("free", "1");
    const qs = params.toString();
    return `/discover${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="page">
      <TopNav user={user} />

      <section className="panel">
        <p className="eyebrow">// Discover Skills</p>
        <h1>All Published Skills</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          {total} skills available
        </p>
      </section>

      <section className="toolbar panel">
        <form className="search" action="/discover">
          <input name="q" placeholder="> search skills by title, tags, description..." defaultValue={q} />
          <label>
            <input type="checkbox" name="free" value="1" defaultChecked={freeOnly} />
            free only
          </label>
          <button type="submit">search</button>
        </form>
      </section>

      <section className="list-section">
        <h2>// Page {page} of {totalPages}</h2>
        <div className="grid">
          {skills.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
        {skills.length === 0 && (
          <p style={{ color: "var(--muted)" }}>No skills found.</p>
        )}
      </section>

      <nav className="pagination">
        {page > 1 ? (
          <Link className="page-link" href={buildHref(page - 1)}>
            {"<"} prev
          </Link>
        ) : (
          <span className="page-link disabled">{"<"} prev</span>
        )}

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            className={`page-link${p === page ? " active" : ""}`}
            href={buildHref(p)}
          >
            {p}
          </Link>
        ))}

        {page < totalPages ? (
          <Link className="page-link" href={buildHref(page + 1)}>
            next {">"}
          </Link>
        ) : (
          <span className="page-link disabled">next {">"}</span>
        )}
      </nav>
    </main>
  );
}
