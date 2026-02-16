import { redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { AuthForms } from "@/components/auth-forms";
import { getSessionUser } from "@/lib/auth";

export default async function AuthPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page">
      <TopNav />
      <section className="panel">
        <p className="eyebrow">Account Access</p>
        <h1>Login or create an account</h1>
      </section>
      <AuthForms />
    </main>
  );
}
