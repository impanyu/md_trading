import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

type TopNavProps = {
  user?: {
    handle: string;
  } | null;
};

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="top-nav">
      <Link href="/" className="brand">
        [md_exchange]
      </Link>
      <nav>
        <Link href="/discover">/discover</Link>
        <Link href="/upload">/upload</Link>
        {user ? <Link href={`/u/${user.handle}`}>/dashboard</Link> : <Link href="/auth">/login</Link>}
        {user ? <LogoutButton /> : null}
      </nav>
    </header>
  );
}
