import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { identifier, password } = body;

  if (!identifier || !password) {
    return NextResponse.json({ error: "identifier and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { handle: identifier }]
    }
  });

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ id: user.id, handle: user.handle, displayName: user.displayName });
  setSessionCookie(response, user.id);
  return response;
}
