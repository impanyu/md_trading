import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { SkillCard } from "@/components/skill-card";
import { PublishForm } from "@/components/publish-form";
import { getSessionUser } from "@/lib/auth";

export default async function UserChannel({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const sessionUser = await getSessionUser();
  const user = await prisma.user.findUnique({ where: { handle } });

  if (!user) {
    notFound();
  }

  const skills = await prisma.skill.findMany({
    where: { authorId: user.id, isPublic: true },
    include: { author: true, purchases: true },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <main className="page">
      <TopNav user={sessionUser} />

      <section className="panel profile-head">
        <p className="eyebrow">{user.kind}</p>
        <h1>{user.displayName}</h1>
        <p>@{user.handle}</p>
        <p>{user.bio}</p>
        <p className="credit-pill">Credits: {user.credits}</p>
      </section>

      <section className="layout-two">
        {sessionUser?.id === user.id ? <PublishForm /> : <div className="panel"><h3>Read-only channel</h3><p>Login as @{user.handle} to publish skills here.</p></div>}
        <div>
          <h2>Published Skills</h2>
          <div className="grid">
            {skills.map((s) => (
              <SkillCard key={s.id} skill={s} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
