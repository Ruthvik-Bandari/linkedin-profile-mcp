#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FULL_GUIDE, SECTIONS } from "./guide.js";
import { LIMITS, keywordCoverage, lintField, reviewExperience, reviewHeadline, type Field } from "./rules.js";

const server = new McpServer({ name: "linkedin-profile-optimizer", version: "0.1.0" });

const json = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const FIELDS = Object.keys(LIMITS) as [Field, ...Field[]];
const SECTION_NAMES = Object.keys(SECTIONS) as [string, ...string[]];

server.registerTool(
  "get_guidelines",
  {
    title: "Get LinkedIn guidelines",
    description: "Return the section-by-section LinkedIn profile guidelines (recruiter-search based). Omit 'section' for the full guide.",
    inputSchema: { section: z.enum(SECTION_NAMES).optional().describe("One section, e.g. headline, about, experience, open_to_work") },
    annotations: { readOnlyHint: true },
  },
  async ({ section }) => ({ content: [{ type: "text", text: section ? SECTIONS[section]! : FULL_GUIDE }] }),
);

server.registerTool(
  "lint_field",
  {
    title: "Lint a profile field",
    description: "Check one LinkedIn field against its character limit and for AI-sounding text (em dashes, stock phrases, 'it's not X, it's Y'), list markers and emoji. Shows what is visible before truncation.",
    inputSchema: { field: z.enum(FIELDS), text: z.string().describe("The exact text of the field") },
    annotations: { readOnlyHint: true },
  },
  async ({ field, text }) => json(lintField(field, text)),
);

server.registerTool(
  "review_headline",
  {
    title: "Review a headline",
    description: "Score a headline: role in the first 60 characters, length used, vague labels, segments, 'open to' line, and target keywords.",
    inputSchema: {
      headline: z.string(),
      target_role: z.string().optional().describe("e.g. 'AI Engineer'"),
      keywords: z.array(z.string()).optional().describe("Must-have terms from job postings"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ headline, target_role, keywords }) => json(reviewHeadline(headline, target_role, keywords ?? [])),
);

server.registerTool(
  "review_experience",
  {
    title: "Review an Experience entry",
    description: "Check one Experience description: length, opening line, bullet count, numbers in bullets, action verbs, duty phrasing, keywords and AI-sounding text.",
    inputSchema: { description: z.string(), keywords: z.array(z.string()).optional() },
    annotations: { readOnlyHint: true },
  },
  async ({ description, keywords }) => json(reviewExperience(description, keywords ?? [])),
);

server.registerTool(
  "keyword_coverage",
  {
    title: "Keyword coverage vs job postings",
    description: "Find terms that recur across the pasted job descriptions and report which ones the profile text contains. Only add a missing term if it truly describes the person's work.",
    inputSchema: {
      profile_text: z.string().describe("Headline, About, Experience and Skills pasted together"),
      job_descriptions: z.array(z.string()).min(1).describe("Full text of 1 to 10 target job postings"),
      top: z.number().int().min(5).max(80).optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ profile_text, job_descriptions, top }) => json(keywordCoverage(profile_text, job_descriptions, top ?? 30)),
);

server.registerTool(
  "review_profile",
  {
    title: "Review a whole profile",
    description: "Run every check on a pasted profile (for example the text of LinkedIn's 'Save to PDF'). Returns per-section results and a checklist. Never logs in to or scrapes LinkedIn.",
    inputSchema: {
      target_role: z.string().optional(),
      headline: z.string(),
      about: z.string().optional(),
      location: z.string().optional(),
      experiences: z.array(z.object({ title: z.string(), company: z.string(), description: z.string() })).optional(),
      skills: z.array(z.string()).optional(),
      featured_count: z.number().int().optional(),
      connections: z.number().int().optional(),
      job_descriptions: z.array(z.string()).optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async (p) => {
    const profileText = [p.headline, p.about ?? "", ...(p.experiences ?? []).map((e) => `${e.title} ${e.company} ${e.description}`), ...(p.skills ?? [])].join("\n");
    const coverage = p.job_descriptions?.length ? keywordCoverage(profileText, p.job_descriptions) : undefined;
    const keywords = coverage ? coverage.covered.concat(coverage.missing).slice(0, 12).map((c) => c.term) : [];
    const checklist = [
      { item: "Location is a metro, not only a country", pass: !!p.location && !/^\s*(united states|usa|india|canada|uk)\s*$/i.test(p.location) },
      { item: "About section present", pass: !!p.about && p.about.length >= 600 },
      { item: "At least one Experience entry with a real description", pass: (p.experiences ?? []).some((e) => e.description.length >= 300) },
      { item: "15 or more skills listed", pass: (p.skills?.length ?? 0) >= 15 },
      { item: "Featured has proof items", pass: (p.featured_count ?? 0) >= 2 },
      { item: "500+ connections", pass: (p.connections ?? 0) >= 500 },
    ];
    return json({
      headline: reviewHeadline(p.headline, p.target_role, keywords),
      about: p.about ? lintField("about", p.about) : "missing",
      experiences: (p.experiences ?? []).map((e) => ({ title: e.title, company: e.company, titleLint: lintField("experience_title", e.title), review: reviewExperience(e.description, keywords) })),
      keywordCoverage: coverage,
      checklist,
    });
  },
);

server.registerResource("guide", "linkedin://guide", { title: "LinkedIn profile guide", mimeType: "text/plain" }, async (uri) => ({ contents: [{ uri: uri.href, text: FULL_GUIDE }] }));
server.registerResource("limits", "linkedin://limits", { title: "LinkedIn field limits", mimeType: "application/json" }, async (uri) => ({ contents: [{ uri: uri.href, text: JSON.stringify(LIMITS, null, 2) }] }));

server.registerPrompt(
  "optimize_section",
  {
    title: "Rewrite one profile section",
    description: "Rewrite a LinkedIn section for a target role using the guidelines, then verify it with the lint tools.",
    argsSchema: { section: z.string(), target_role: z.string(), current_text: z.string(), facts: z.string().optional() },
  },
  ({ section, target_role, current_text, facts }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: `Rewrite my LinkedIn ${section} for ${target_role} roles.

Rules: call get_guidelines for "${section}" first. Use only facts in my current text or the facts below; never invent numbers, titles, tools or results; ask me when a number would help. Plain first person, no em dashes, no stock phrases. Keep team credit honest and nothing confidential. Then run lint_field (and review_headline or review_experience where it applies) on your draft and fix every error and warning before showing it.

Current text:
${current_text}
${facts ? `\nFacts I can back up:\n${facts}` : ""}` },
    }],
  }),
);

server.registerPrompt(
  "full_profile_review",
  {
    title: "Full profile review",
    description: "Review a pasted profile like a technical recruiter: what I see first, the one fix that matters most, and why, then section by section.",
    argsSchema: { profile_text: z.string(), target_role: z.string(), job_descriptions: z.string().optional() },
  },
  ({ profile_text, target_role, job_descriptions }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: `Review my LinkedIn profile for ${target_role} roles the way a technical recruiter screens in 10 seconds.

1. Split the profile into sections and call review_profile${job_descriptions ? " with the job descriptions below" : ""}.
2. Start with: what you see first, the one fix that would get a recruiter to the next click, and why it matters for this search.
3. Then go section by section using get_guidelines: one strength and one fix each, with rewritten text I can paste. Never invent facts.

Profile:
${profile_text}
${job_descriptions ? `\nJob descriptions:\n${job_descriptions}` : ""}` },
    }],
  }),
);

await server.connect(new StdioServerTransport());
