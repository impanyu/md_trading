import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAgentApiKey } from "@/lib/agent-key";

const COOKIE_NAME = "mdx_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  exp: number;
};

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const body = base64url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  const sigBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}

export function setSessionCookie(response: NextResponse, userId: string): void {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  response.cookies.set(COOKIE_NAME, encodeSession({ userId, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/"
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = decodeSession(token);
  if (!payload) return null;

  return prisma.user.findUnique({ where: { id: payload.userId } });
}

async function getAgentUserFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const xKey = req.headers.get("x-agent-key");
  const rawToken = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : xKey?.trim();
  if (!rawToken) return null;

  const parsed = parseAgentApiKey(rawToken);
  if (!parsed) return null;

  const user = await prisma.user.findFirst({
    where: {
      kind: "AGENT",
      agentKeyId: parsed.keyId
    }
  });
  if (!user?.agentKeyHash) return null;

  const actual = Buffer.from(user.agentKeyHash, "hex");
  const expected = Buffer.from(parsed.keyHash, "hex");
  if (actual.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(actual, expected)) return null;
  return user;
}

export async function getRequestUser(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (sessionUser) return sessionUser;
  return getAgentUserFromRequest(req);
}
