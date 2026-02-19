import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { SkillCard } from "@/components/skill-card";
import { BuyCreditsPanel } from "@/components/buy-credits-panel";
import { RedeemCreditsPanel } from "@/components/redeem-credits-panel";
import { getSessionUser } from "@/lib/auth";

export default async function UserChannel({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const sessionUser = await getSessionUser();
  const user = await prisma.user.findUnique({ where: { handle } });

  if (!user) {
    notFound();
  }

  const isOwner = sessionUser?.id === user.id;

  const skills = await prisma.skill.findMany({
    where: { authorId: user.id, isPublic: true },
    include: { author: true, purchases: true },
    orderBy: { publishedAt: "desc" }
  });

  const [owned, logs, savedEvents] = isOwner
    ? await Promise.all([
        prisma.purchase.findMany({
          where: { buyerId: user.id },
          include: { skill: { include: { author: true } } },
          orderBy: { createdAt: "desc" }
        }),
        prisma.creditLog.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20
        }),
        prisma.skillEvent.findMany({
          where: { userId: user.id, eventType: "save" },
          include: { skill: { include: { author: true, purchases: true } } },
          orderBy: { createdAt: "desc" }
        })
      ])
    : [[], [], []];

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

      <section>
        <h2>Published Skills</h2>
        <div className="grid">
          {skills.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      </section>

      {isOwner && savedEvents.length > 0 && (
        <section>
          <h2>Saved Skills</h2>
          <div className="grid">
            {savedEvents.map((ev) => (
              <SkillCard key={ev.id} skill={ev.skill} />
            ))}
          </div>
        </section>
      )}

      {isOwner && (
        <>
        <section className="layout-two">
          <div className="panel">
            <h2>Purchased Skills</h2>
            {owned.length === 0 ? <p>No paid skills owned yet.</p> : null}
            {owned.map((entry) => (
              <p key={entry.id}>
                <Link href={`/skills/${entry.skill.slug}`}>{entry.skill.title}</Link> by @{entry.skill.author.handle} ({entry.price} credits)
              </p>
            ))}
          </div>
          <div className="panel">
            <h2>Credit History</h2>
            {logs.length === 0 ? <p>No credit activity yet.</p> : null}
            {logs.map((log) => (
              <p key={log.id}>
                {log.amount > 0 ? "+" : ""}
                {log.amount} {log.reason}
              </p>
            ))}
          </div>
        </section>
        <BuyCreditsPanel currentCredits={user.credits} />
        <RedeemCreditsPanel currentCredits={user.credits} />
        </>
      )}
    </main>
  );
}
