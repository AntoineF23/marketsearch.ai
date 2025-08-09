MarketSearch.ai — AI-Powered Market Research homepage with streaming report generation.

## Getting Started

1) Set env vars

```bash
export OPENAI_API_KEY=your_key
# optional: override model
export OPENAI_MODEL=gpt-4o
```

2) Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and generate a report.

## Notes

- API at `app/api/research/route.ts` streams plain text for simplicity.
- Edit the prompt in that file to fine-tune output.
