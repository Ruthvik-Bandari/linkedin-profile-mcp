# LinkedIn Profile Optimizer MCP

## Commands
npm run build     # compile
npm test          # tests
npm run inspect   # MCP Inspector

## Layout
- src/rules.ts: deterministic checks (limits, AI-sounding text, headline, experience, keyword coverage). Keep them pure and tested.
- src/guide.ts: section guidance text.
- src/index.ts: tools, resources and prompts (registerTool / registerResource / registerPrompt, Zod schemas).

## Rules
- Never add LinkedIn login, scraping, posting or any network call. Users paste text in and copy results out.
- Prompts must tell the model to use only the user's facts and never invent numbers.
