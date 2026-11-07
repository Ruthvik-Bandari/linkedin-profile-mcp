import { describe, expect, it } from "vitest";
import { keywordCoverage, lintField, reviewExperience, reviewHeadline } from "../src/rules.js";

describe("lintField", () => {
  it("flags a headline over 220 characters", () => {
    const r = lintField("headline", "x".repeat(230));
    expect(r.issues.some((i) => i.severity === "error" && i.message.includes("over the 220"))).toBe(true);
  });
  it("flags em dashes and stock phrases", () => {
    const r = lintField("about", "I am passionate about AI — and I leverage data.".repeat(30));
    const msgs = r.issues.map((i) => i.message).join(" ");
    expect(msgs).toContain("dash");
    expect(msgs).toContain("passionate about");
    expect(msgs).toContain("leverage");
  });
  it("counts emoji-free characters with code points", () => {
    expect(lintField("comment", "héllo").characters).toBe(5);
  });
  it("passes clean text with no warnings", () => {
    const r = lintField("connection_note", "Hi Sam, I saw your talk on retrieval evaluation and would like to connect.");
    expect(r.issues.filter((i) => i.severity !== "tip")).toHaveLength(0);
  });
});

describe("reviewHeadline", () => {
  it("rejects vague headlines", () => {
    const r = reviewHeadline("Student at State University", "AI Engineer");
    expect(r.checks.find((c) => c.name === "Not a vague label")?.pass).toBe(false);
    expect(r.checks.find((c) => c.name.startsWith("Target role"))?.pass).toBe(false);
  });
  it("accepts a strong headline", () => {
    const h = "AI Engineer | LLM evaluation, RAG, Python, PyTorch | ML Intern at Acme Health | Shipped a retrieval QA service used by 3 teams | Open to AI and Machine Learning Engineer roles, June 2027";
    const r = reviewHeadline(h, "AI Engineer", ["RAG", "Python"]);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });
});

describe("reviewExperience", () => {
  it("flags a bare one-liner", () => {
    const r = reviewExperience("Worked on machine learning models.");
    expect(r.checks.find((c) => c.name === "More than a one-line entry")?.pass).toBe(false);
    expect(r.issues.some((i) => i.message.includes("Duty phrasing"))).toBe(true);
  });
  it("credits bullets with verbs and numbers", () => {
    const d = `Our team of three builds an order-routing service for a regional logistics company's operations group.
• Built a rules engine that scores 1.2M orders in 60 seconds.
• Designed a perturbation test with 12 error types.
• Met 4 warehouse teams to map the workflow.`;
    const r = reviewExperience(d);
    expect(r.bullets).toBe(3);
    expect(r.bulletsWithNumbers).toBe(3);
    expect(r.bulletsStartingWithVerb).toBe(3);
  });
});

describe("keywordCoverage", () => {
  it("finds recurring terms and reports missing ones", () => {
    const jds = [
      "We need Python, PyTorch and experience with retrieval augmented generation. Kubernetes a plus.",
      "Python and PyTorch required. Retrieval augmented generation experience. Kubernetes.",
      "Strong Python. PyTorch. Kubernetes deployment.",
    ];
    const r = keywordCoverage("I build RAG systems in Python and PyTorch.", jds);
    expect(r.covered.map((c) => c.term)).toEqual(expect.arrayContaining(["python", "pytorch"]));
    expect(r.missing.map((c) => c.term)).toContain("kubernetes");
  });
});
