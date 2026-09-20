# Clean code

How to write and place code in this repo. Read this before adding, moving, splitting, or naming modules, components, or routes.

Done when every new or moved unit has one reason to change, lives in the folder that matches that reason, is named kebab-case, and the route file only composes.

## Layout

TanStack Start owns the skeleton. Put React UI in `src/components/`, file routes in `src/routes/`, generated/router/start files at `src/` root. Domain data stays in `src/content/`; analytics ports stay in `src/analytics/`.

```
src/
  routes/                 # file routes — compose, do not render tiles
  components/
    geist/                # Grid, Badge, Avatar
    link-hub/             # Link Hub page, tiles, hooks
  content/                # locale, hub-config, seo
  analytics/              # visit / link / action tracking
```

A route file loads Locale, analytics, and origin, then mounts one page component. Grid markup, tiles, and Visit state live under `src/components/`.

## One reason

Split a file when it already changes for more than one reason (page chrome vs tile vs hook vs type guard). Keep a unit with its neighbours: `Avatar` next to `Badge` in geist, `isConfiguredLink` next to `HubLink`, `useOsDark` in `hooks.ts` next to the page that reads scheme.

Re-export only when a caller outside the folder needs a barrel; same-folder imports go to the file.

## Names

Name files kebab-case after the unit (`link-hub-page.tsx`, `hub-footer.tsx`, `hooks.ts`). Tests keep the same stem (`link-hub-page.test.tsx`, `link-hub-page.reduced-motion.test.tsx`). The export stays PascalCase (`LinkHubPage` in `link-hub-page.tsx`).

## Extract

Pull a hook, type guard, or presentational unit up when the same shape already exists in two places, or when the page file is carrying helpers that never render. Leave variant-specific markup in the variant until a winner is folded in; then delete the rest.

A type guard belongs beside the union it narrows. A `use*` that is not JSX belongs in `hooks.ts`, not inside the page component file.

## Throwaway

A prototype answers a design question, then leaves. After a verdict, the main branch keeps only the winning UI. Delete the switcher, `?variant=` search params, and losing variants in the same change that records the verdict.
