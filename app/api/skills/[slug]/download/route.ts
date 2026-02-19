import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { id: true, slug: true, markdown: true, isPublic: true, price: true, authorId: true }
  });

  if (!skill || !skill.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Paid skills require authentication and purchase (or being the author)
  if (skill.price > 0) {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    if (user.id !== skill.authorId) {
      const purchased = await prisma.purchase.findUnique({
        where: { buyerId_skillId: { buyerId: user.id, skillId: skill.id } }
      });
      if (!purchased) {
        return NextResponse.json({ error: "Purchase required" }, { status: 403 });
      }
    }
  }

  // Try pre-built zip bundle first
  const zipPath = path.join(process.cwd(), "public", "downloads", `${slug}.zip`);
  if (fs.existsSync(zipPath)) {
    const zipBuffer = fs.readFileSync(zipPath);
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}.zip"`
      }
    });
  }

  // Fallback: create zip from markdown content on the fly
  const tmpDir = path.join("/tmp", `skill-zip-${slug}`);
  const skillDir = path.join(tmpDir, slug);
  const tmpZip = path.join(tmpDir, `${slug}.zip`);

  try {
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), skill.markdown);
    execSync(`cd "${tmpDir}" && zip -r "${tmpZip}" "${slug}"`, { stdio: "pipe" });

    const zipBuffer = fs.readFileSync(tmpZip);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}.zip"`
      }
    });
  } catch {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    // Last resort: plain markdown
    return new NextResponse(skill.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.md"`
      }
    });
  }
}
