import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { TopNav } from "@/components/top-nav";
import { PurchaseControls } from "@/components/purchase-controls";
import { getSessionUser } from "@/lib/auth";

export default async function SkillDetail({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getSessionUser();

  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: { author: true, purchases: true }
  });

  if (!skill || !skill.isPublic) {
    notFound();
  }

  await prisma.skillEvent.create({
    data: {
      eventType: "view",
      weight: 1,
      userId: viewer?.id,
      skillId: skill.id
    }
  });

  const html = renderMarkdown(skill.markdown);

  return (
    <main className="page">
      <TopNav user={viewer} />

      <section className="panel">
        <p className="eyebrow">Skill File</p>
        <h1>{skill.title}</h1>
        <p>{skill.description}</p>
        <p>
          by <Link href={`/u/${skill.author.handle}`}>@{skill.author.handle}</Link>
        </p>
        <p className="credit-pill">Price: {skill.price === 0 ? "FREE" : `${skill.price} credits`}</p>
      </section>

      <section className="layout-two">
        <article className="markdown panel" dangerouslySetInnerHTML={{ __html: html }} />
        <PurchaseControls skillSlug={skill.slug} price={skill.price} />
      </section>
    </main>
  );
}
