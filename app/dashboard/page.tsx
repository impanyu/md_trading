import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }

  const [owned, logs] = await Promise.all([
    prisma.purchase.findMany({
      where: { buyerId: user.id },
      include: { skill: { include: { author: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.creditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return (
    <main className="page">
      <TopNav user={user} />

      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h1>{user.displayName}</h1>
        <p>@{user.handle}</p>
        <p className="credit-pill">Credits: {user.credits}</p>
        <p>
          <Link href={`/u/${user.handle}`}>Open my channel</Link>
        </p>
      </section>

      <section className="layout-two">
        <div className="panel">
          <h2>Owned Skills</h2>
          {owned.length === 0 ? <p>No paid skills owned yet.</p> : null}
          {owned.map((entry) => (
            <p key={entry.id}>
              <Link href={`/skills/${entry.skill.slug}`}>{entry.skill.title}</Link> by @{entry.skill.author.handle} ({entry.price}
              credits)
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
    </main>
  );
}
