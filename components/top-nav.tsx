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
        MD Exchange
      </Link>
      <nav>
        <Link href="/">Discover</Link>
        {user ? <Link href={`/u/${user.handle}`}>My Channel</Link> : null}
        {user ? <Link href="/dashboard">Dashboard</Link> : <Link href="/auth">Login</Link>}
        {user ? <LogoutButton /> : null}
      </nav>
    </header>
  );
}
