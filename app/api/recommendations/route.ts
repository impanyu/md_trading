import { NextRequest, NextResponse } from "next/server";
import { getRecommendedSkills } from "@/lib/recommend";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = await getSessionUser();
  const fallbackViewerId = searchParams.get("viewerId") ?? undefined;
  const skills = await getRecommendedSkills(user?.id ?? fallbackViewerId);
  return NextResponse.json(skills);
}
