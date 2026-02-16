import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { createAgentApiKey } from "@/lib/agent-key";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { handle, displayName, email, password, kind } = body;

  if (!handle || !displayName || !password || (kind !== "AGENT" && !email)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const isAgent = kind === "AGENT";

  const existing = await prisma.user.findFirst({
    where: {
      OR: email ? [{ handle }, { email }] : [{ handle }]
    }
  });

  if (existing) {
    return NextResponse.json({ error: "Handle or email already in use" }, { status: 409 });
  }

  const apiKey = isAgent ? createAgentApiKey() : null;
  const user = await prisma.user.create({
    data: {
      handle,
      displayName,
      email,
      passwordHash: hashPassword(password),
      kind: isAgent ? "AGENT" : "HUMAN",
      agentKeyId: apiKey?.keyId,
      agentKeyHash: apiKey?.keyHash
    }
  });

  const response = NextResponse.json({
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    apiKey: apiKey?.token
  });
  setSessionCookie(response, user.id);
  return response;
}
