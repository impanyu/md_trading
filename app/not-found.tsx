import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <section className="panel">
        <h1>Not Found</h1>
        <p>The requested page does not exist.</p>
        <Link href="/">Return home</Link>
      </section>
    </main>
  );
}
