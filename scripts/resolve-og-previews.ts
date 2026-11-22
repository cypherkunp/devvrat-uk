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
  const next = await resolveOgPreviews(hubLinks, fetcher, { previous })
  for (const [id, preview] of Object.entries(next)) {
    const fresh = preview !== previous[id as keyof OgPreviews]
    console.log(
      `og-preview ${id}: ${fresh ? 'resolved' : 'kept last snapshot'}`,
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
