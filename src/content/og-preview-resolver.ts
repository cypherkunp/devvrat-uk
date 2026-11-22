/**
 * Build-time OG preview resolver: fetches opted-in Link destinations and parses
 * their Open Graph tags. Only the build script imports this; the page reads
 * the committed snapshot through `og-preview.ts`.
 */
import type { ConfiguredLink } from '#/content/hub-config'
import type { OgPreview, OgPreviews } from '#/content/og-preview'

/**
 * `fetch`-shaped, so tests pass canned responses and the build passes `fetch`.
 * The resolver follows redirects itself, so it can refuse any that leave https.
 */
export type OgFetcher = (
  url: string,
  init: { signal: AbortSignal; redirect: 'manual' },
) => Promise<Response>

const maxRedirects = 5

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

type Fetched = { response: Response; url: string }

/**
 * A successful response for `href`, reached through at most `maxRedirects`
 * redirects, every one of them https. Anything else is no response.
 */
async function fetchHttps(
  href: string,
  fetcher: OgFetcher,
  signal: AbortSignal,
): Promise<Fetched | undefined> {
  let url = httpsUrl(href, href)
  for (let hop = 0; url && hop <= maxRedirects; hop++) {
    const response = await fetcher(url, { signal, redirect: 'manual' })
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      url = httpsUrl(location, url)
      continue
    }
    if (!response.ok) return undefined
    // A fetcher that followed redirects anyway must still have stayed on https.
    if (response.url && !httpsUrl(response.url, url)) return undefined
    return { response, url: response.url || url }
  }
  return undefined
}

/**
 * Runs `task` with an abort signal, giving `undefined` once `timeoutMs`
 * passes or if the task throws. A task that ignores the signal still loses.
 */
async function withinTimeout<T>(
  timeoutMs: number,
  task: (signal: AbortSignal) => Promise<T | undefined>,
): Promise<T | undefined> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      controller.abort()
      resolve(undefined)
    }, timeoutMs)
  })
  const running = task(controller.signal)

  try {
    return await Promise.race([running, timedOut])
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
    running.catch(() => {})
  }
}

function previewOf(
  href: string,
  fetcher: OgFetcher,
  timeoutMs: number,
): Promise<OgPreview | undefined> {
  return withinTimeout(timeoutMs, async (signal) => {
    const fetched = await fetchHttps(href, fetcher, signal)
    if (!fetched) return undefined
    return parseOgPreview(await fetched.response.text(), fetched.url)
  })
}

/**
 * The OG preview snapshot: one entry for every https Link that opts in, and
 * none for any other Link. This is the only place the opt-in is read. Never
 * throws: a failed, slow, or empty destination keeps its `previous` entry, or
 * has none.
 */
export async function resolveOgPreviews(
  links: ConfiguredLink[],
  fetcher: OgFetcher,
  {
    previous = {},
    timeoutMs = 5000,
  }: { previous?: OgPreviews; timeoutMs?: number } = {},
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
    const fresh =
      preview && Object.keys(preview).length > 0 ? preview : undefined
    const kept = fresh ?? previous[id]
    if (kept) previews[id] = kept
  }
  return previews
}
