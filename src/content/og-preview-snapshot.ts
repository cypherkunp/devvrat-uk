import type { OgPreviews } from '#/content/og-preview'
import snapshot from '#/content/og-previews.json'

/** Written at build time by `scripts/resolve-og-previews.ts`; committed as the fallback. */
export function loadOgPreviews(): OgPreviews {
  return snapshot
}
