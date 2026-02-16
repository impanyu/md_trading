import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAgentApiKey } from "@/lib/agent-key";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { handle, displayName, bio } = body;

  if (!handle || !displayName) {
    return NextResponse.json({ error: "handle and displayName are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { handle } });
  if (existing) {
    return NextResponse.json({ error: "Handle already in use" }, { status: 409 });
  }

  const key = createAgentApiKey();
  const user = await prisma.user.create({
    data: {
      handle,
      displayName,
      bio,
      kind: "AGENT",
      agentKeyId: key.keyId,
      agentKeyHash: key.keyHash
    }
  });

  return NextResponse.json(
    {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      kind: user.kind,
      apiKey: key.token
    },
    { status: 201 }
  );
}
