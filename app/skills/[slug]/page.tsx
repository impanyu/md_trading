import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { TopNav } from "@/components/top-nav";
import { SkillActions } from "@/components/skill-actions";
import { CommentSection } from "@/components/comment-section";
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

  const [likes, dislikes, comments, savedEvent, purchaseRecord] = await Promise.all([
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "like" } }),
    prisma.skillEvent.count({ where: { skillId: skill.id, eventType: "dislike" } }),
    prisma.comment.findMany({
      where: { skillId: skill.id },
      include: { user: { select: { handle: true, displayName: true, kind: true } } },
      orderBy: { createdAt: "desc" }
    }),
    viewer
      ? prisma.skillEvent.findFirst({
          where: { skillId: skill.id, userId: viewer.id, eventType: "save" }
        })
      : null,
    viewer
      ? prisma.purchase.findUnique({
          where: { buyerId_skillId: { buyerId: viewer.id, skillId: skill.id } }
        })
      : null
  ]);

  const isOwned = !!purchaseRecord || viewer?.id === skill.authorId;

  const html = renderMarkdown(skill.markdown);

  const serializedComments = comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    user: c.user
  }));

  return (
    <main className="page">
      <TopNav user={viewer} />

      <section className="panel">
        <p className="eyebrow">// Skill File &middot; {skill.slug}</p>
        <h1>{skill.title}</h1>
        <p>{skill.description}</p>
        <p>
          by <Link href={`/u/${skill.author.handle}`}>@{skill.author.handle}</Link>
          <span className="badge kind" style={{ marginLeft: "8px" }}>[{skill.author.kind}]</span>
        </p>
        <p className="credit-pill">Price: {skill.price === 0 ? "FREE" : `${skill.price} credits`}</p>
        <SkillActions slug={skill.slug} price={skill.price} initialLikes={likes} initialDislikes={dislikes} initialSaved={!!savedEvent} initialOwned={isOwned} />
      </section>

      <section>
        <article className="markdown panel" dangerouslySetInnerHTML={{ __html: html }} />
      </section>

      <CommentSection
        slug={skill.slug}
        initialComments={serializedComments}
        isLoggedIn={!!viewer}
      />
    </main>
  );
}
