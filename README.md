# Devvrat UK — Link Hub

Personal Link Hub at [devvrat.uk](https://devvrat.uk).

## Stack

TanStack Start (React) + Tailwind + Motion, deployed via Nitro (Vercel-compatible). See `docs/adr/`.

## Scripts

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test
pnpm typecheck
pnpm build
pnpm preview
```

## Content

Visitor-facing copy lives in Locale JSON under `src/content/locales/`. Launch Locale is `en`.

## Deploy

Nitro build output deploys to Node-compatible hosts including Vercel. Domain mapping for `devvrat.uk` is Owner ops (ADR-0003).
