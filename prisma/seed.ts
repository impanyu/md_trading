import { PrismaClient, UserKind } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { createAgentApiKey } from "../lib/agent-key";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/*  Helper: convert a slug like "agent-config" → "Agent Config"       */
/* ------------------------------------------------------------------ */
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/*  Load real skill markdown content from fetched files                 */
/* ------------------------------------------------------------------ */
const CONTENTS_FILE = path.join(__dirname, "../scripts/skill-contents.json");
const skillContents: Record<string, string> = fs.existsSync(CONTENTS_FILE)
  ? JSON.parse(fs.readFileSync(CONTENTS_FILE, "utf-8"))
  : {};

function getMarkdown(slug: string, title: string, description: string, category: string): string {
  if (skillContents[slug]) return skillContents[slug];
  return `# ${title}\n\n## Description\n${description}\n\n## Source\nOriginally from OpenClaw community registry.\n\n## Category\n${category}`;
}

/* ------------------------------------------------------------------ */
/*  Top 100 skills from the OpenClaw community registry README        */
/* ------------------------------------------------------------------ */
interface RawSkill {
  slug: string;
  description: string;
  category: string;
}

const openClawSkills: RawSkill[] = [
  // ── Coding Agents & IDEs ──────────────────────────────────────────
  { slug: "agent-config", description: "Intelligently modify agent core context files", category: "Coding Agents & IDEs" },
  { slug: "agent-council", description: "Complete toolkit for creating autonomous AI agents and managing multi-agent workflows", category: "Coding Agents & IDEs" },
  { slug: "agent-identity-kit", description: "A portable identity system for AI agents", category: "Coding Agents & IDEs" },
  { slug: "agentlens", description: "Navigate and understand codebases using agentlens hierarchical code analysis", category: "Coding Agents & IDEs" },
  { slug: "agentskills-io", description: "Create, validate, and publish Agent Skills following the open standard", category: "Coding Agents & IDEs" },
  { slug: "buildlog", description: "Record, export, and share your AI coding sessions as replayable buildlogs", category: "Coding Agents & IDEs" },
  { slug: "cc-godmode", description: "Self-orchestrating multi-agent development workflows", category: "Coding Agents & IDEs" },
  { slug: "claude-optimised", description: "Guide for writing and optimizing CLAUDE.md files", category: "Coding Agents & IDEs" },
  { slug: "claude-team", description: "Orchestrate multiple Claude Code workers via iTerm2", category: "Coding Agents & IDEs" },
  { slug: "code-mentor", description: "Comprehensive AI programming tutor for all levels", category: "Coding Agents & IDEs" },
  { slug: "coding-agent", description: "Run Codex CLI, Claude Code, OpenCode, or Pi Coding Agent from a single interface", category: "Coding Agents & IDEs" },
  { slug: "cognitive-memory", description: "Intelligent multi-store memory system with human-like recall and forgetting", category: "Coding Agents & IDEs" },
  { slug: "cto-advisor", description: "Technical leadership guidance for engineering teams", category: "Coding Agents & IDEs" },
  { slug: "cursor-agent", description: "A comprehensive skill for using the Cursor CLI agent", category: "Coding Agents & IDEs" },
  { slug: "debug-pro", description: "Systematic debugging methodology and language-specific debugging techniques", category: "Coding Agents & IDEs" },
  { slug: "docker-essentials", description: "Essential Docker commands and workflows for container management", category: "Coding Agents & IDEs" },
  { slug: "docker-sandbox", description: "Create and manage Docker sandboxed VM environments for safe code execution", category: "Coding Agents & IDEs" },
  { slug: "ec-excalidraw", description: "Generate hand-drawn style diagrams, flowcharts, and architecture visualizations", category: "Coding Agents & IDEs" },
  { slug: "ec-task-orchestrator", description: "Autonomous multi-agent task orchestration for complex workflows", category: "Coding Agents & IDEs" },
  { slug: "evolver", description: "A self-evolution engine for AI agents", category: "Coding Agents & IDEs" },
  { slug: "mcp-builder", description: "Guide for creating high-quality MCP (Model Context Protocol) servers", category: "Coding Agents & IDEs" },
  { slug: "python", description: "Python coding guidelines and best practices", category: "Coding Agents & IDEs" },
  { slug: "regex-patterns", description: "Practical regex patterns across languages and use cases", category: "Coding Agents & IDEs" },
  { slug: "skill-vetting", description: "Vet ClawHub skills for security and utility before installation", category: "Coding Agents & IDEs" },
  { slug: "ssh-tunnel", description: "SSH tunneling, port forwarding, and remote access patterns", category: "Coding Agents & IDEs" },
  { slug: "tdd-guide", description: "Test-driven development workflow with test generation, coverage analysis, and refactoring", category: "Coding Agents & IDEs" },
  { slug: "test-runner", description: "Write and run tests across languages and frameworks", category: "Coding Agents & IDEs" },
  { slug: "vhs-recorder", description: "Create professional terminal recordings with VHS tape files", category: "Coding Agents & IDEs" },
  { slug: "arbiter", description: "Push decisions to Arbiter Zebu for async human review and approval", category: "Coding Agents & IDEs" },
  { slug: "backend-patterns", description: "Backend architecture patterns, API design, and database best practices", category: "Coding Agents & IDEs" },
  { slug: "copilot-money", description: "Query Copilot Money personal finance data for budgeting and analysis", category: "Coding Agents & IDEs" },
  { slug: "idea-coach", description: "AI-powered idea/problem/challenge manager with GitHub integration", category: "Coding Agents & IDEs" },
  { slug: "piv", description: "PIV workflow orchestrator - Plan, Implement, Validate loop for systematic development", category: "Coding Agents & IDEs" },
  { slug: "prompt-log", description: "Extract conversation transcripts from AI coding session logs for review", category: "Coding Agents & IDEs" },
  { slug: "senior-architect", description: "Senior architecture review and system design guidance for complex projects", category: "Coding Agents & IDEs" },
  { slug: "smart-auto-updater", description: "Smart auto-updater with AI-powered impact analysis for dependency upgrades", category: "Coding Agents & IDEs" },
  { slug: "satellite-copilot", description: "Predict satellite passes and track orbital objects in real time", category: "Coding Agents & IDEs" },
  { slug: "essence-distiller", description: "Find what actually matters in your content — the ideas that persist across contexts", category: "Coding Agents & IDEs" },
  { slug: "rationality", description: "A structured framework for thinking, reasoning, and decision-making under uncertainty", category: "Coding Agents & IDEs" },
  { slug: "quests", description: "Track and guide humans through complex multi-step real-world processes", category: "Coding Agents & IDEs" },
  { slug: "stoic-scope-creep", description: "A practical guide for maintaining composure and focus during scope expansion", category: "Coding Agents & IDEs" },

  // ── Git & GitHub ──────────────────────────────────────────────────
  { slug: "auto-pr-merger", description: "Automates the workflow of checking out a GitHub PR, running tests, and merging", category: "Git & GitHub" },
  { slug: "backup", description: "Backup and restore openclaw configuration, skills, commands, and settings", category: "Git & GitHub" },
  { slug: "bat-cat", description: "A cat clone with syntax highlighting, line numbers, and Git integration", category: "Git & GitHub" },
  { slug: "bitbucket-automation", description: "Automate Bitbucket repositories, pull requests, and pipelines", category: "Git & GitHub" },
  { slug: "conventional-commits", description: "Format commit messages using the Conventional Commits specification", category: "Git & GitHub" },
  { slug: "deepwiki", description: "Query the DeepWiki MCP server for GitHub repository documentation and wiki content", category: "Git & GitHub" },
  { slug: "emergency-rescue", description: "Recover from developer disasters including broken builds and corrupted repos", category: "Git & GitHub" },
  { slug: "git-essentials", description: "Essential Git commands and workflows for version control mastery", category: "Git & GitHub" },
  { slug: "git-helper", description: "Common git operations as a skill (status, pull, push, branch, log)", category: "Git & GitHub" },
  { slug: "git-workflows", description: "Advanced git operations beyond add/commit/push including rebasing and cherry-picking", category: "Git & GitHub" },
  { slug: "github", description: "Interact with GitHub using the gh CLI for issues, PRs, and repo management", category: "Git & GitHub" },
  { slug: "github-pr", description: "Fetch, preview, merge, and test GitHub PRs locally", category: "Git & GitHub" },
  { slug: "gitlab-api", description: "GitLab API integration for repository operations", category: "Git & GitHub" },
  { slug: "gitlab-manager", description: "Manage GitLab repositories, merge requests, and issues via API", category: "Git & GitHub" },
  { slug: "gitload", description: "Download files, folders, or entire repos from GitHub URLs", category: "Git & GitHub" },
  { slug: "pr-reviewer", description: "Automated GitHub PR code review with diff analysis and lint checks", category: "Git & GitHub" },
  { slug: "unfuck-my-git-state", description: "Diagnose and recover broken Git state and worktree issues", category: "Git & GitHub" },
  { slug: "work-report", description: "Write a daily or weekly work report using git commits", category: "Git & GitHub" },
  { slug: "trend-watcher", description: "Monitors GitHub Trending and tech communities for emerging projects", category: "Git & GitHub" },
  { slug: "claw-swarm", description: "Collaborative agent swarm for attempting extremely difficult engineering tasks", category: "Git & GitHub" },
  { slug: "commit-analyzer", description: "Analyzes git commit patterns to monitor autonomous agent development activity", category: "Git & GitHub" },
  { slug: "danube", description: "Use Danube's 100+ API tools (Gmail, GitHub, Notion, etc.) through MCP", category: "Git & GitHub" },
  { slug: "deploy-agent", description: "Multi-step deployment agent for full-stack applications", category: "Git & GitHub" },

  // ── Moltbook ──────────────────────────────────────────────────────
  { slug: "agentchat", description: "Real-time communication with other AI agents via AgentChat protocol", category: "Moltbook" },
  { slug: "moltbook", description: "The social network for AI agents", category: "Moltbook" },
  { slug: "whisper", description: "End-to-end encrypted agent-to-agent private messaging via Moltbook", category: "Moltbook" },
  { slug: "moltoverflow", description: "Stack Overflow for Moltbots - ask coding questions, share solutions, and earn reputation", category: "Moltbook" },
  { slug: "moltspeak", description: "Communication protocol for agent internet with token reduction and efficiency", category: "Moltbook" },
  { slug: "moltbot-best-practices", description: "Best practices for AI agents operating in production environments", category: "Moltbook" },
  { slug: "moltbot-security", description: "Security hardening guide for AI agents", category: "Moltbook" },
  { slug: "speedtest", description: "Test internet connection speed using Ookla's Speedtest CLI", category: "Moltbook" },

  // ── Web & Frontend Development ────────────────────────────────────
  { slug: "anthropic-frontend-design", description: "Create distinctive, production-grade frontend interfaces with Anthropic design principles", category: "Web & Frontend Development" },
  { slug: "api-dev", description: "Scaffold, test, document, and debug REST and GraphQL APIs", category: "Web & Frontend Development" },
  { slug: "artifacts-builder", description: "Suite of tools for creating elaborate, multi-component interactive artifacts", category: "Web & Frontend Development" },
  { slug: "ask-a-human", description: "Request judgment from random humans when uncertain about decisions", category: "Web & Frontend Development" },
  { slug: "computer-use", description: "Full desktop computer use for headless Linux servers and VPS", category: "Web & Frontend Development" },
  { slug: "discord", description: "Control Discord from your AI agent via the discord tool integration", category: "Web & Frontend Development" },
  { slug: "elixir-dev", description: "Elixir/Phoenix development companion for building robust web applications", category: "Web & Frontend Development" },
  { slug: "frontend-design", description: "Create distinctive, production-grade frontend interfaces with high design quality", category: "Web & Frontend Development" },
  { slug: "ghost", description: "Manage Ghost CMS blog posts via Admin API", category: "Web & Frontend Development" },
  { slug: "guardrails", description: "Helps users configure comprehensive security guardrails for AI applications", category: "Web & Frontend Development" },
  { slug: "image-router", description: "Generate AI images with any model using ImageRouter API", category: "Web & Frontend Development" },
  { slug: "instantdb", description: "Real-time database integration with InstantDB for reactive applications", category: "Web & Frontend Development" },
  { slug: "nextjs-expert", description: "Build Next.js 14/15 applications with the App Router and modern patterns", category: "Web & Frontend Development" },
  { slug: "nodetool", description: "Visual AI workflow builder - ComfyUI meets n8n for LLM agents and RAG pipelines", category: "Web & Frontend Development" },
  { slug: "perf-profiler", description: "Profile and optimize application performance across the full stack", category: "Web & Frontend Development" },
  { slug: "phoenix-api-gen", description: "Generate a full Phoenix JSON API from an OpenAPI spec", category: "Web & Frontend Development" },
  { slug: "database-operations", description: "Design database schemas, write queries, and manage migrations", category: "Web & Frontend Development" },
  { slug: "dns-networking", description: "Debug DNS resolution and network connectivity issues", category: "Web & Frontend Development" },
  { slug: "openguardrails", description: "Detect and block prompt injection attacks hidden in long context inputs", category: "Web & Frontend Development" },
  { slug: "linux-service-triage", description: "Diagnoses common Linux service issues using logs and system commands", category: "Web & Frontend Development" },
  { slug: "odoo-manager", description: "Manage Odoo contacts, business objects, and metadata via API", category: "Web & Frontend Development" },
  { slug: "kicad-pcb", description: "Automate PCB design with KiCad for electronics prototyping", category: "Web & Frontend Development" },
  { slug: "miniflux-news", description: "Fetch and triage the latest unread RSS/news entries from Miniflux", category: "Web & Frontend Development" },
  { slug: "fireflies", description: "Access Fireflies.ai meeting transcripts, summaries, and action items", category: "Web & Frontend Development" },
  { slug: "hardcover", description: "Query reading lists and book data from Hardcover.app via GraphQL API", category: "Web & Frontend Development" },
  { slug: "business-model-canvas", description: "Build, fill, stress-test, and iterate on business model canvases", category: "Web & Frontend Development" },
  { slug: "ceo-advisor", description: "Executive leadership guidance for strategic decision-making", category: "Web & Frontend Development" },
  { slug: "flaw0", description: "Security and vulnerability scanner for OpenClaw code, plugins, and skills", category: "Web & Frontend Development" },
];

/* ------------------------------------------------------------------ */
/*  Build tags from category + description keywords                    */
/* ------------------------------------------------------------------ */
function buildTags(category: string, description: string): string {
  const catTag = category.toLowerCase().replace(/[&]/g, "and").replace(/\s+/g, "-");
  const words = description.toLowerCase().split(/\s+/);
  const keywords: string[] = [];
  const interesting = [
    "agent", "ai", "git", "github", "docker", "api", "cli", "security",
    "test", "debug", "deploy", "automation", "workflow", "mcp", "frontend",
    "backend", "database", "orchestration", "review", "coding", "memory",
    "protocol", "encrypted", "real-time", "monitoring", "search", "linux",
    "design", "architecture", "social", "network", "production", "react",
    "nextjs", "elixir", "phoenix", "python", "devops", "cloud", "browser",
    "image", "video", "audio", "messaging", "finance", "productivity",
  ];
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9-]/g, "");
    if (interesting.includes(clean) && !keywords.includes(clean)) {
      keywords.push(clean);
    }
    if (keywords.length >= 3) break;
  }
  return [catTag, ...keywords].slice(0, 4).join(",");
}

/* ------------------------------------------------------------------ */
/*  Main seed                                                         */
/* ------------------------------------------------------------------ */
async function main() {
  // ── 1. Upsert human user ──────────────────────────────────────────
  const impanyu = await prisma.user.upsert({
    where: { handle: "impanyu" },
    update: {
      email: "impanyu@example.com",
      passwordHash: hashPassword("abcd1234")
    },
    create: {
      handle: "impanyu",
      displayName: "Im Panyu",
      email: "impanyu@example.com",
      passwordHash: hashPassword("abcd1234"),
      kind: UserKind.HUMAN,
      bio: "Builds multi-agent systems and shares production prompts.",
      credits: 240
    }
  });

  // ── 2. Create official-bot agent ──────────────────────────────────
  const officialBot = await prisma.user.upsert({
    where: { handle: "official-bot" },
    update: {
      bio: "Curated collection of top community skills from OpenClaw registry."
    },
    create: {
      handle: "official-bot",
      displayName: "Official Bot",
      email: "official-bot@md.exchange",
      kind: UserKind.AGENT,
      bio: "Curated collection of top community skills from OpenClaw registry.",
      credits: 1000
    }
  });

  // Ensure official bot has a usable API key
  if (!officialBot.agentKeyId || !officialBot.agentKeyHash) {
    const key = createAgentApiKey();
    await prisma.user.update({
      where: { id: officialBot.id },
      data: { agentKeyId: key.keyId, agentKeyHash: key.keyHash }
    });
    console.log("official-bot api key:", key.token);
  }

  // ── 3. Upsert the three original skills ────────────────────────────
  const originalSkills = [
    {
      slug: "skill-contract-register-and-post",
      title: "Skill Contract: Register and Post",
      description: "A protocol-style markdown template for agent skill registration and publishing.",
      markdown: `# Skill Contract\n\n## Objective\nRegister agent identity and publish a skill markdown file with pricing metadata.\n\n## Required Fields\n- agent_id\n- skill_slug\n- tags\n- price_credits\n- license\n\n## Endpoint Sequence\n1. Validate identity\n2. Upload markdown\n3. Confirm listing visibility\n`,
      tags: "agent,registry,protocol",
      price: 0,
      isPublic: true,
      authorId: officialBot.id
    },
    {
      slug: "quant-research-skill-pack",
      title: "Quant Research Skill Pack",
      description: "Signal generation + backtest checklist skill pack for autonomous finance agents.",
      markdown: `# Quant Research Skill Pack\n\n## Modules\n- Market Regime Classifier\n- Position Sizing Rules\n- Drawdown Guardrails\n\n## Usage\nUse this skill pack when evaluating liquid futures and FX baskets.`,
      tags: "quant,trading,finance",
      price: 10,
      isPublic: true,
      authorId: officialBot.id
    },
    {
      slug: "human-readable-agent-handshake",
      title: "Human-Readable Agent Handshake",
      description: "A markdown convention for human + agent collaboration context handoff.",
      markdown: `# Handshake Guide\n\n## Steps\n1. State objective\n2. Share constraints\n3. Confirm allowed tools\n4. Publish outputs\n`,
      tags: "workflow,collaboration,md",
      price: 40,
      isPublic: true,
      authorId: impanyu.id
    }
  ];

  for (const row of originalSkills) {
    await prisma.skill.upsert({
      where: { slug: row.slug },
      update: row,
      create: row
    });
  }

  // ── 4. Seed the top 100 OpenClaw community skills ──────────────────
  let created = 0;
  for (const s of openClawSkills) {
    const title = slugToTitle(s.slug);
    const tags = buildTags(s.category, s.description);
    const markdown = getMarkdown(s.slug, title, s.description, s.category);

    await prisma.skill.upsert({
      where: { slug: s.slug },
      update: {
        title,
        description: s.description,
        markdown,
        tags,
        price: 0,
        isPublic: true,
        authorId: officialBot.id
      },
      create: {
        slug: s.slug,
        title,
        description: s.description,
        markdown,
        tags,
        price: 0,
        isPublic: true,
        authorId: officialBot.id
      }
    });
    created++;
  }

  console.log(`\nSeeded ${originalSkills.length} original skills + ${created} OpenClaw community skills.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
