/**
 * Build step: resolve OG preview for opted-in Links and write the committed
 * snapshot the Link Hub imports. Never fails the build — a Link whose
 * destination is down keeps its last snapshot entry, or has none.
 */
import { readFile, writeFile } from 'node:fs/promises'

import { hubLinks } from '../src/content/hub-config.ts'
import { resolveOgPreviews } from '../src/content/og-preview-resolver.ts'
import type { OgFetcher } from '../src/content/og-preview-resolver.ts'
import type { OgPreviews } from '../src/content/og-preview.ts'

const snapshotUrl = new URL('../src/content/og-previews.json', import.meta.url)

const fetcher: OgFetcher = (url, { signal }) =>
  fetch(url, {
    signal,
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0 (compatible; og-preview-build)',
    },
  })

async function readSnapshot(): Promise<{ raw: string; previews: OgPreviews }> {
  const raw = await readFile(snapshotUrl, 'utf8').catch(() => '')
  try {
    return { raw, previews: JSON.parse(raw) as OgPreviews }
  } catch {
    return { raw, previews: {} }
  }
}

async function main() {
  const { raw, previews: previous } = await readSnapshot()
  const resolved = await resolveOgPreviews(hubLinks, fetcher)

  const next: OgPreviews = {}
  for (const link of hubLinks) {
    if (!link.ogPreview) continue
    const preview = resolved[link.id] ?? previous[link.id]
    if (preview) next[link.id] = preview
    console.log(
      `og-preview ${link.id}: ${resolved[link.id] ? 'resolved' : preview ? 'kept last snapshot' : 'none'}`,
    )
  }

  const text = `${JSON.stringify(next, null, 2)}\n`
  if (text !== raw) await writeFile(snapshotUrl, text)
}

try {
  await main()
} catch (error) {
  console.warn('og-preview: skipped, keeping the last snapshot', error)
}
