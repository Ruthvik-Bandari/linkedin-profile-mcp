#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FULL_GUIDE, SECTIONS } from "./guide.js";
import { LIMITS, keywordCoverage, lintField, reviewExperience, reviewHeadline, type Field } from "./rules.js";

const server = new McpServer({ name: "linkedin-profile-optimizer", version: "0.1.1" });

const json = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const FIELDS = Object.keys(LIMITS) as [Field, ...Field[]];
const SECTION_NAMES = Object.keys(SECTIONS) as [string, ...string[]];

server.registerTool(
  "get_guidelines",
  {
    title: "Get LinkedIn guidelines",
    description: "Return LinkedIn profile writing guidelines based on how technical recruiters search. Use this before drafting or rewriting a section; it is reference text and does not check anything (use lint_field or the review_* tools to check text). Returns plain text: rules, character limits and examples for one section, or the whole guide when 'section' is omitted. Read-only, no network.",
    inputSchema: { section: z.enum(SECTION_NAMES).optional().describe("Which section to return, e.g. 'headline', 'about', 'experience', 'open_to_work', 'skills', 'checklist'. Omit to get every section in one text.") },
    annotations: { readOnlyHint: true },
  },
  async ({ section }) => ({ content: [{ type: "text", text: section ? SECTIONS[section]! : FULL_GUIDE }] }),
);

server.registerTool(
  "lint_field",
  {
    title: "Lint a profile field",
    description: "Check the text of one LinkedIn field (or a post, comment or connection note) before the user pastes it. Use for any single field; for a headline or an Experience entry prefer review_headline or review_experience, which run these checks plus structure checks. Checks the character limit, em and en dashes, stock phrases that read as AI-written, the 'it's not X, it's Y' pattern, '-' list markers and emoji, and shows the text visible before 'see more'. Returns JSON: { field, characters, limit, issues: [{ severity: 'error' | 'warn' | 'tip', message }] }; errors must be fixed, warnings should be. Read-only, no network.",
    inputSchema: {
      field: z.enum(FIELDS).describe("Which field the text is for; this sets the limit. headline 220, about 2600, experience_title 100, experience_description 2000, featured_title ~45, featured_description ~200, post 3000, comment 1250, connection_note 200."),
      text: z.string().describe("The exact text of the field, as it would be pasted into LinkedIn"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ field, text }) => json(lintField(field, text)),
);

server.registerTool(
  "review_headline",
  {
    title: "Review a headline",
    description: "Review a LinkedIn headline against recruiter-search rules. Use this for headlines instead of lint_field; use review_profile to check a whole profile at once. Runs pass/fail checks: not a vague label ('Student at X', 'Aspiring'), target role in the first 60 characters, at least 150 of 220 characters used, 3 or more segments separated by '|', an 'Open to ... roles' line, and target keywords present; plus all lint_field checks. Returns JSON: { characters, limit, issues: [...], checks: [{ name, pass, detail }] }. Rewrite and call again until every check passes. Read-only, no network.",
    inputSchema: {
      headline: z.string().describe("The full headline text, up to 220 characters"),
      target_role: z.string().optional().describe("The job title the person wants, e.g. 'AI Engineer'. Enables the 'role in the first 60 characters' check."),
      keywords: z.array(z.string()).optional().describe("Must-have terms from target job postings, e.g. ['Python', 'RAG']. Passes when at least 2 appear. Get them from keyword_coverage."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ headline, target_role, keywords }) => json(reviewHeadline(headline, target_role, keywords ?? [])),
);

server.registerTool(
  "review_experience",
  {
    title: "Review an Experience entry",
    description: "Review the description of one LinkedIn Experience entry (one role). Use it once per role; use review_profile to check every role together with the rest of the profile. Pass/fail checks: at least 300 characters, an opening line that explains the role on its own, 3 to 7 bullets, most bullets with a number, most bullets starting with an action verb, and target keywords; it also warns on duty phrasing ('responsible for', 'worked on') and runs all lint_field checks. Returns JSON: { characters, limit, issues: [...], bullets, bulletsWithNumbers, bulletsStartingWithVerb, checks: [{ name, pass, detail }] }. Read-only, no network.",
    inputSchema: {
      description: z.string().describe("The full description text of one role, up to 2,000 characters. Bullets may start with '•', '-' or '*'."),
      keywords: z.array(z.string()).optional().describe("Target terms from job postings. Passes when at least a third of them appear. Get them from keyword_coverage."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ description, keywords }) => json(reviewExperience(description, keywords ?? [])),
);

server.registerTool(
  "keyword_coverage",
  {
    title: "Keyword coverage vs job postings",
    description: "Compare a profile with target job postings. Use it first when the user has job descriptions: it finds single words and two-word phrases that recur across the postings (in at least 2 postings when 3 or more are given) and reports which ones appear in the profile. Feed the results to review_headline and review_experience as 'keywords'. Returns JSON: { covered: [{ term, inPostings, inProfile }], missing: [...], coverage: '<n> of <m> ...' }, ranked by how many postings use each term. Only suggest adding a missing term if it truly describes the person's work. Read-only, no network.",
    inputSchema: {
      profile_text: z.string().describe("Headline, About, Experience and Skills pasted together as plain text"),
      job_descriptions: z.array(z.string()).min(1).describe("Full text of 1 to 10 target job postings, one string per posting"),
      top: z.number().int().min(5).max(80).optional().describe("How many recurring terms to report, 5 to 80. Default 30."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ profile_text, job_descriptions, top }) => json(keywordCoverage(profile_text, job_descriptions, top ?? 30)),
);

server.registerTool(
  "review_profile",
  {
    title: "Review a whole profile",
    description: "Review a whole LinkedIn profile in one call. Use it for a first full review; then use review_headline, review_experience or lint_field on single sections while rewriting. Split the user's pasted profile (for example the text of LinkedIn's 'Save to PDF') into the fields below. Runs review_headline, lint_field on About, review_experience on each role, keyword_coverage when job descriptions are given (its top 12 terms become the keywords for the other checks), and a checklist. Returns JSON: { headline, about, experiences: [{ title, company, titleLint, review }], keywordCoverage, checklist: [{ item, pass }] }. Read-only; never logs in to or scrapes LinkedIn.",
    inputSchema: {
      target_role: z.string().optional().describe("The job title the person wants, e.g. 'Data Scientist'"),
      headline: z.string().describe("The headline text"),
      about: z.string().optional().describe("The About section text"),
      location: z.string().optional().describe("The location shown on the profile, e.g. 'Boston, MA'. A country alone fails the checklist."),
      experiences: z.array(z.object({
        title: z.string().describe("Job title"),
        company: z.string().describe("Company name"),
        description: z.string().describe("The role's description text"),
      })).optional().describe("Each Experience entry, most recent first"),
      skills: z.array(z.string()).optional().describe("Every listed skill, one per item"),
      featured_count: z.number().int().optional().describe("How many items are in the Featured section"),
      connections: z.number().int().optional().describe("Number of connections (use 500 for '500+')"),
      job_descriptions: z.array(z.string()).optional().describe("Full text of 1 to 10 target job postings, one string per posting"),
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
