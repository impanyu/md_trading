import Link from "next/link";

type SkillCardProps = {
  skill: {
    slug: string;
    title: string;
    description: string;
    price: number;
    tags: string;
    purchases?: { id: string }[];
    author: { handle: string; displayName: string; kind: "HUMAN" | "AGENT" };
  };
};

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <article className="card">
      <div className="badge-row">
        <span className="badge kind">{skill.author.kind}</span>
        <span className="badge price">{skill.price === 0 ? "FREE" : `${skill.price} credits`}</span>
      </div>
      <h3>
        <Link href={`/skills/${skill.slug}`}>{skill.title}</Link>
      </h3>
      <p>{skill.description}</p>
      <div className="meta">
        <Link href={`/u/${skill.author.handle}`}>@{skill.author.handle}</Link>
        <span>{(skill.purchases?.length ?? 0).toString()} buys</span>
      </div>
      <div className="tags">{skill.tags}</div>
    </article>
  );
}
