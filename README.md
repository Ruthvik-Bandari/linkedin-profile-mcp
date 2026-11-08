# LinkedIn Profile Optimizer (MCP server)

[![npm](https://img.shields.io/npm/v/linkedin-profile-mcp)](https://www.npmjs.com/package/linkedin-profile-mcp)
[![CI](https://github.com/Ruthvik-Bandari/linkedin-profile-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ruthvik-Bandari/linkedin-profile-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Glama score](https://glama.ai/mcp/servers/Ruthvik-Bandari/linkedin-profile-mcp/badges/score.svg)](https://glama.ai/mcp/servers/Ruthvik-Bandari/linkedin-profile-mcp)

An MCP server that helps people rewrite their LinkedIn profile the way technical recruiters search for candidates. Paste your profile text into Claude (or any MCP client); the server checks every field against LinkedIn's limits and recruiter-search guidelines, and the assistant rewrites sections from your own facts.

It never logs in to LinkedIn, scrapes it, or posts anything. You paste text in and copy the improved text back yourself.

The guidelines come from a senior technical recruiter's talk on how recruiters search LinkedIn, plus lessons from rebuilding real profiles with them.

## What it gives your assistant

| Tool | What it does |
|---|---|
| `get_guidelines` | Section-by-section guidance (headline, About, Experience, Open to Work, Featured, skills and more) |
| `lint_field` | Character limit, what shows before truncation, em dashes, stock AI phrases, list markers, emoji |
| `review_headline` | Role in the first 60 characters, length used, vague labels, segments, "open to" line, keywords |
| `review_experience` | Opening line, bullet count, numbers per bullet, action verbs, duty phrasing, keywords |
| `keyword_coverage` | Terms that recur across the job postings you paste, and which ones your profile is missing |
| `review_profile` | All of the above on a whole profile, plus a checklist (location, About, skills, Featured, connections) |

Prompts: `optimize_section` (rewrite one section, then lint it) and `full_profile_review` (a recruiter-style review: what I see first, the one fix, then section by section).
Resources: `linkedin://guide`, `linkedin://limits`.

All checks are deterministic: no network calls and no API keys.

## Install

Requires Node.js 18 or newer. Nothing to clone: `npx` downloads and runs it.

### Claude Code

```bash
claude mcp add linkedin-profile -- npx -y linkedin-profile-mcp
```

### Claude Desktop, Cursor, Windsurf, Cline

Add to the client's MCP config (`claude_desktop_config.json`, `~/.cursor/mcp.json`, and so on):

```json
{
  "mcpServers": {
    "linkedin-profile": {
      "command": "npx",
      "args": ["-y", "linkedin-profile-mcp"]
    }
  }
}
```

### VS Code (Copilot agent mode)

```bash
code --add-mcp '{"name":"linkedin-profile","command":"npx","args":["-y","linkedin-profile-mcp"]}'
```

### From source

```bash
git clone https://github.com/Ruthvik-Bandari/linkedin-profile-mcp.git
cd linkedin-profile-mcp && npm install && npm run build
claude mcp add linkedin-profile -- node "$PWD/dist/index.js"
```

## Use it

1. On LinkedIn, open your profile, click **More**, then **Save to PDF**, and copy the text (or paste each section).
2. Collect 3 to 10 job descriptions for the role you want.
3. Ask your assistant: "Use the full_profile_review prompt for AI Engineer roles" and paste both. Or: "Rewrite my headline for Data Scientist roles and lint it."
4. Copy the improved text back into LinkedIn yourself. Turn off "Share profile updates" while you edit.

The assistant is told to use only facts you give it. Check every claim before you paste it: anything on your profile should be something you can explain in an interview.

## Example

> **You:** Review my headline for AI Engineer roles: "Student at State University | passionate about AI"
>
> The assistant calls `review_headline` and gets back: vague label (fail), "AI Engineer" not in the first 60 characters (fail), 49 of 220 characters used (fail), no segments (fail), no "open to" line (fail), plus a stock-phrase warning for "passionate about". It then drafts a new headline from facts you give it and re-checks it until every check passes.

## Contributing

Issues and pull requests are welcome, especially new checks backed by recruiter guidance, and limit updates when LinkedIn changes its editor. Keep every check deterministic and covered by a test in `test/`.

## Develop

```bash
npm test          # unit tests (vitest)
npm run build     # compile to dist/
npm run inspect   # try the tools in the MCP Inspector
```

Rules live in `src/rules.ts`, guidance text in `src/guide.ts`, and tool registration in `src/index.ts`.

## License

MIT
