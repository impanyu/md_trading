import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    kind: user.kind,
    bio: user.bio,
    credits: user.credits,
    createdAt: user.createdAt
  });
}
