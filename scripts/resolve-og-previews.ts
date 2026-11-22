/**
 * Build step: resolve OG preview for opted-in Links, download their images
 * into `public/og-previews/`, and write the committed snapshot the Link Hub
 * imports. Never fails the build: a Link whose destination is down keeps its
 * last snapshot entry, or has none. Files change only when their content does,
 * so a build with nothing new leaves the git tree clean.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'

import { hubLinks } from '../src/content/hub-config.ts'
import {
  ogImageDirectory,
  resolveOgPreviews,
} from '../src/content/og-preview-resolver.ts'
import type {
  OgFetcher,
  OgImageFile,
} from '../src/content/og-preview-resolver.ts'
import type { OgPreviews } from '../src/content/og-preview.ts'

const snapshotUrl = new URL('../src/content/og-previews.json', import.meta.url)
const imageDirectoryUrl = new URL(
  `../public/${ogImageDirectory}/`,
  import.meta.url,
)

const fetcher: OgFetcher = (url, init) =>
  fetch(url, {
    ...init,
    headers: {
      accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8',
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

async function writeIfChanged(url: URL, content: Uint8Array | string) {
  const current = await readFile(url).catch(() => undefined)
  const next = typeof content === 'string' ? Buffer.from(content) : content
  if (current && Buffer.compare(current, next) === 0) return false
  await writeFile(url, next)
  return true
}

/** Writes new images, then removes any the snapshot no longer points at. */
async function syncImages(images: OgImageFile[], previews: OgPreviews) {
  await mkdir(imageDirectoryUrl, { recursive: true })
  for (const image of images) {
    await writeIfChanged(new URL(image.name, imageDirectoryUrl), image.bytes)
  }
  const kept = new Set(
    Object.values(previews).map((preview) => preview.image?.split('/').pop()),
  )
  for (const name of await readdir(imageDirectoryUrl)) {
    if (!kept.has(name)) await rm(new URL(name, imageDirectoryUrl))
  }
}

async function main() {
  const { raw, previews: previous } = await readSnapshot()
  const { previews, images } = await resolveOgPreviews(hubLinks, fetcher, {
    previous,
  })

  await syncImages(images, previews)
  const text = `${JSON.stringify(previews, null, 2)}\n`
  if (text !== raw) await writeFile(snapshotUrl, text)

  for (const link of hubLinks) {
    if (!link.ogPreview) continue
    const preview = previews[link.id]
    const image = preview?.image ? ` (image ${preview.image})` : ''
    console.log(`og-preview ${link.id}: ${preview ? 'ok' : 'none'}${image}`)
  }
}

try {
  await main()
} catch (error) {
  console.warn('og-preview: skipped, keeping the last snapshot', error)
}
