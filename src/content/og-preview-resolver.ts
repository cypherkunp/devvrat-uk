/**
 * Build-time OG preview resolver: fetches opted-in Link destinations and parses
 * their Open Graph tags. Only the build script imports this; the page reads
 * the committed snapshot through `og-preview.ts`.
 */
import type { ConfiguredLink } from '#/content/hub-config'
import type { OgPreview, OgPreviews } from '#/content/og-preview'

/** `fetch`-shaped, so tests pass canned HTML and the build passes `fetch`. */
export type OgFetcher = (
  url: string,
  init: { signal: AbortSignal },
) => Promise<Response>

const namedEntities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

/** Plain text out: entities decoded, whitespace collapsed. React escapes on render. */
function decodeText(raw: string): string {
  return raw
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
      if (code[0] !== '#') return namedEntities[code.toLowerCase()] ?? entity
      const point =
        code[1] === 'x' || code[1] === 'X'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10)
      return point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : entity
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function attributes(tag: string): Partial<Record<string, string>> {
  const found: Partial<Record<string, string>> = {}
  for (const [, name, , value] of tag.matchAll(
    /([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g,
  )) {
    found[name.toLowerCase()] = decodeText(value)
  }
  return found
}

function httpsUrl(raw: string | undefined, base: string): string | undefined {
  if (!raw) return undefined
  try {
    const url = new URL(raw, base)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/** Drops empty fields so a missing value never shadows Locale copy. */
function withoutEmptyFields(preview: OgPreview): OgPreview {
  return Object.fromEntries(
    Object.entries(preview).filter(([, value]) => value),
  )
}

function parseOgPreview(html: string, pageUrl: string): OgPreview {
  const meta: Partial<Record<string, string>> = {}
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const { property, name, content } = attributes(tag)
    const key = (property ?? name)?.toLowerCase()
    if (key && content !== undefined && !(key in meta)) meta[key] = content
  }
  const documentTitle = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]

  return withoutEmptyFields({
    title:
      meta['og:title'] ||
      (documentTitle === undefined ? undefined : decodeText(documentTitle)),
    description: meta['og:description'] || meta.description,
    image: httpsUrl(meta['og:image'], pageUrl),
  })
}

async function previewOf(
  href: string,
  fetcher: OgFetcher,
  timeoutMs: number,
): Promise<OgPreview | undefined> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      controller.abort()
      resolve(undefined)
    }, timeoutMs)
  })
  const fetched = (async () => {
    const response = await fetcher(href, { signal: controller.signal })
    if (!response.ok) return undefined
    return parseOgPreview(await response.text(), response.url || href)
  })()

  try {
    // A fetcher that ignores the signal still loses the race.
    return await Promise.race([fetched, timedOut])
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
    fetched.catch(() => {})
  }
}

/**
 * OG preview for every https Link that opts in. Never throws: a failed, slow,
 * or empty destination is simply absent from the result.
 */
export async function resolveOgPreviews(
  links: ConfiguredLink[],
  fetcher: OgFetcher,
  { timeoutMs = 5000 }: { timeoutMs?: number } = {},
): Promise<OgPreviews> {
  const candidates = links.filter(
    (link) => link.ogPreview && link.href.startsWith('https://'),
  )
  const resolved = await Promise.all(
    candidates.map(
      async (link) =>
        [link.id, await previewOf(link.href, fetcher, timeoutMs)] as const,
    ),
  )

  const previews: OgPreviews = {}
  for (const [id, preview] of resolved) {
    if (preview && Object.keys(preview).length > 0) previews[id] = preview
  }
  return previews
}
