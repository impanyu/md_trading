import crypto from "node:crypto";

const PREFIX = "mdx_agent";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createAgentApiKey() {
  const keyId = crypto.randomBytes(8).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  const token = `${PREFIX}_${keyId}_${secret}`;

  return {
    token,
    keyId,
    keyHash: sha256(secret)
  };
}

export function parseAgentApiKey(token: string): { keyId: string; keyHash: string } | null {
  if (!token.startsWith(`${PREFIX}_`)) return null;
  const parts = token.split("_");
  if (parts.length !== 4) return null;
  const keyId = parts[2];
  const secret = parts[3];
  if (!keyId || !secret) return null;

  return { keyId, keyHash: sha256(secret) };
}
