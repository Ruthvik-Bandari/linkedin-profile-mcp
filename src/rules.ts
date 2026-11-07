// Deterministic checks for LinkedIn profile text. No network, no LLM.

export type Field =
  | "headline"
  | "about"
  | "experience_title"
  | "experience_description"
  | "featured_title"
  | "featured_description"
  | "post"
  | "comment"
  | "connection_note";

export const LIMITS: Record<Field, { max: number; visible?: number; note: string }> = {
  headline: { max: 220, visible: 60, note: "About 60 characters show in search results and invitations." },
  about: { max: 2600, visible: 300, note: "Only the first 2 to 3 lines show before 'see more'. Aim for 1,600 to 2,400." },
  experience_title: { max: 100, note: "Title, company and location are 100 characters each." },
  experience_description: { max: 2000, visible: 200, note: "The first 2 lines show before 'see more'." },
  featured_title: { max: 45, note: "Featured cards show about 45 characters of the title (observed, not official)." },
  featured_description: { max: 200, note: "About 200 characters show on the card (observed, not official)." },
  post: { max: 3000, visible: 200, note: "About 200 characters show before 'see more'." },
  comment: { max: 1250, note: "" },
  connection_note: { max: 200, note: "Kept under 200 so it fits every account type." },
};

// Phrases recruiters read as AI-written or empty filler.
export const STOCK_PHRASES = [
  "passionate about", "results-driven", "results driven", "leverage", "leveraging", "utilize", "utilizing",
  "robust", "seamless", "seamlessly", "cutting-edge", "cutting edge", "transformative", "empower", "foster",
  "streamline", "elevate", "harness", "synergy", "game-changer", "game changer", "world-class", "delve",
  "dynamic professional", "proven track record", "go-getter", "detail-oriented", "team player",
  "hard-working", "hardworking", "self-starter", "thought leader", "rockstar", "ninja", "guru",
  "in today's fast-paced", "fast-paced environment", "spearheaded", "aspiring",
];

export const VAGUE_HEADLINES = [
  /^\s*student\b/i, /\baspiring\b/i, /^\s*(mba|ms|bs|phd)\s+(candidate|student)\s*$/i,
  /\blooking for (new )?opportunities\b/i, /\bopen to work\s*$/i, /^\s*seeking\b/i,
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const DASHES = /[—–]/g;
const LIST_MARKER = /^\s*[-*]\s+/m;
const NUMBER = /\d/;

export interface Issue { severity: "error" | "warn" | "tip"; message: string }
export interface LintResult { field: Field; characters: number; limit: number; issues: Issue[] }

export function lintField(field: Field, text: string): LintResult {
  const lim = LIMITS[field];
  const chars = [...text].length;
  const issues: Issue[] = [];
  if (chars === 0) issues.push({ severity: "error", message: "Empty." });
  if (chars > lim.max) issues.push({ severity: "error", message: `${chars} characters, over the ${lim.max} limit by ${chars - lim.max}.` });
  if (field === "headline" && chars < 120) issues.push({ severity: "tip", message: `Only ${chars} of 220 characters used. Add skills, where you work or study, proof, and the roles you are open to.` });
  if (field === "about" && chars < 1200) issues.push({ severity: "tip", message: `${chars} characters. Most strong About sections run 1,600 to 2,400.` });
  const dashes = text.match(DASHES)?.length ?? 0;
  if (dashes) issues.push({ severity: "warn", message: `${dashes} em or en dash(es). Recruiters name dashes as a sign of AI-written text; use commas, periods or "to".` });
  const lower = text.toLowerCase();
  const stock = STOCK_PHRASES.filter((p) => lower.includes(p));
  if (stock.length) issues.push({ severity: "warn", message: `Stock phrases: ${stock.join(", ")}. Replace each with a concrete fact.` });
  if (EMOJI.test(text)) issues.push({ severity: "tip", message: "Contains emoji. Fine in posts; in profile fields they can count as two characters and read as unprofessional." });
  if (field !== "post" && LIST_MARKER.test(text)) issues.push({ severity: "tip", message: "Lines start with '-' or '*'. LinkedIn shows them literally; use '•' for bullets." });
  if (/\bit'?s not\b[^.]{0,60}\bit'?s\b/i.test(text)) issues.push({ severity: "warn", message: "\"It's not X, it's Y\" contrast: a common AI pattern. State the point directly." });
  if (lim.visible && chars > lim.visible) {
    issues.push({ severity: "tip", message: `First ${lim.visible} characters (what shows before truncation): "${[...text].slice(0, lim.visible).join("")}"` });
  }
  return { field, characters: chars, limit: lim.max, issues };
}

export interface HeadlineReview extends LintResult { checks: { name: string; pass: boolean; detail: string }[] }

export function reviewHeadline(headline: string, targetRole?: string, keywords: string[] = []): HeadlineReview {
  const base = lintField("headline", headline);
  const first60 = [...headline].slice(0, 60).join("").toLowerCase();
  const lower = headline.toLowerCase();
  const checks = [] as HeadlineReview["checks"];
  checks.push({ name: "Not a vague label", pass: !VAGUE_HEADLINES.some((r) => r.test(headline)), detail: "Avoid 'Student at X', 'Aspiring ...', 'Seeking opportunities'." });
  if (targetRole) checks.push({ name: "Target role in the first 60 characters", pass: first60.includes(targetRole.toLowerCase()), detail: `Put "${targetRole}" at the start.` });
  checks.push({ name: "Uses most of the 220 characters", pass: base.characters >= 150, detail: `${base.characters} of 220.` });
  checks.push({ name: "Has segments (role | skills | where | proof | open to)", pass: (headline.match(/[|•·]/g)?.length ?? 0) >= 2, detail: "Separate 3 to 5 segments with ' | '." });
  checks.push({ name: "Says what roles you are open to", pass: /\bopen to\b|\bseeking\b|\blooking for\b/i.test(headline), detail: "End with 'Open to <titles> roles' (and a start date if you are a student)." });
  if (keywords.length) {
    const hit = keywords.filter((k) => lower.includes(k.toLowerCase()));
    checks.push({ name: "Includes target keywords", pass: hit.length >= Math.min(2, keywords.length), detail: `Found ${hit.length} of ${keywords.length}: ${hit.join(", ") || "none"}.` });
  }
  return { ...base, checks };
}

const VERBS = /^(built|designed|developed|led|launched|shipped|created|implemented|trained|deployed|wrote|ran|cut|reduced|increased|improved|grew|automated|analyzed|managed|owned|delivered|migrated|scaled|optimized|architected|coordinated|mentored|researched|evaluated|benchmarked|found|rebuilt|co-built|added|set up|met|presented|published|won)\b/i;

export interface ExperienceReview extends LintResult { bullets: number; bulletsWithNumbers: number; bulletsStartingWithVerb: number; checks: { name: string; pass: boolean; detail: string }[] }

export function reviewExperience(description: string, keywords: string[] = []): ExperienceReview {
  const base = lintField("experience_description", description);
  const lines = description.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[•\-*·]/.test(l)).map((l) => l.replace(/^[•\-*·]\s*/, ""));
  const withNum = bullets.filter((b) => NUMBER.test(b)).length;
  const withVerb = bullets.filter((b) => VERBS.test(b) || /^(we|i)\s/i.test(b)).length;
  const first = lines[0] ?? "";
  const lower = description.toLowerCase();
  const checks = [
    { name: "More than a one-line entry", pass: base.characters >= 300, detail: "A bare one-liner hides good work: say what the team does, what you built, numbers, stack and who you worked with." },
    { name: "Opening line explains the role on its own", pass: first.length >= 60 && !/^[•\-*·]/.test(first), detail: `Opening line: "${first.slice(0, 120)}"` },
    { name: "3 to 7 bullets", pass: bullets.length >= 3 && bullets.length <= 7, detail: `${bullets.length} bullet(s).` },
    { name: "Most bullets carry a number", pass: bullets.length > 0 && withNum / bullets.length >= 0.6, detail: `${withNum} of ${bullets.length} bullets have a number.` },
    { name: "Bullets start with an action", pass: bullets.length > 0 && withVerb / bullets.length >= 0.7, detail: `${withVerb} of ${bullets.length} start with a verb (or "We"/"I").` },
  ];
  if (keywords.length) {
    const hit = keywords.filter((k) => lower.includes(k.toLowerCase()));
    checks.push({ name: "Includes target keywords", pass: hit.length >= Math.ceil(keywords.length / 3), detail: `Found ${hit.length} of ${keywords.length}: ${hit.join(", ") || "none"}.` });
  }
  if (/\bresponsible for\b|\bduties included\b|\bworked on\b/i.test(description)) {
    base.issues.push({ severity: "warn", message: "Duty phrasing ('responsible for', 'worked on'). Rewrite as what you built and the result." });
  }
  return { ...base, bullets: bullets.length, bulletsWithNumbers: withNum, bulletsStartingWithVerb: withVerb, checks };
}

// Keyword coverage: terms that recur across job descriptions vs the profile.
const STOP = new Set(("a an and are as at be by for from has have in is it its of on or that the to with will you your we our they their this these those who what when where which while about across into over under than then there able must should can may including include includes such other more most new work working team teams role roles experience years year strong ability skills skill knowledge understanding using use used based level plus etc e.g i.e via within per well also all any both each one two three requirements required preferred qualifications responsibilities job position candidate candidates opportunity company equal employer").split(/\s+/));

function terms(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9+#./ -]/g, " ").split(/\s+/).map((w) => w.replace(/^[.\-/]+|[.\-/]+$/g, "")).filter((w) => w.length > 1 && !STOP.has(w) && !/^\d+$/.test(w));
  const out = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    out.add(words[i]!);
    if (i + 1 < words.length) out.add(`${words[i]} ${words[i + 1]}`);
  }
  return [...out];
}

export interface Coverage { term: string; inPostings: number; inProfile: boolean }

export function keywordCoverage(profileText: string, jobDescriptions: string[], top = 30): { covered: Coverage[]; missing: Coverage[]; coverage: string } {
  const counts = new Map<string, number>();
  for (const jd of jobDescriptions) for (const t of terms(jd)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const minDocs = jobDescriptions.length >= 3 ? 2 : 1;
  const ranked = [...counts.entries()]
    .filter(([t, n]) => n >= minDocs && (t.includes(" ") || t.length > 2))
    .sort((a, b) => b[1] - a[1] || (b[0].includes(" ") ? 1 : 0) - (a[0].includes(" ") ? 1 : 0))
    .slice(0, top);
  const prof = profileText.toLowerCase();
  const rows = ranked.map(([term, n]) => ({ term, inPostings: n, inProfile: prof.includes(term) }));
  const covered = rows.filter((r) => r.inProfile);
  const missing = rows.filter((r) => !r.inProfile);
  return { covered, missing, coverage: `${covered.length} of ${rows.length} recurring posting terms appear in the profile` };
}
