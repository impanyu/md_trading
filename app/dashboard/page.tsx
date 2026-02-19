import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }
  redirect(`/u/${user.handle}`);
}
