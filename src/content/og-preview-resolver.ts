/**
 * Build-time OG preview resolver: fetches opted-in Link destinations and parses
 * their Open Graph tags. Only the build script imports this; the page reads
 * the committed snapshot through `og-preview.ts`.
 */
import type { ConfiguredLink, LinkId } from '#/content/hub-config'
import type { OgPreview, OgPreviews } from '#/content/og-preview'

/**
 * `fetch`-shaped, so tests pass canned responses and the build passes `fetch`.
 * The resolver follows redirects itself, so it can refuse any that leave https.
 */
export type OgFetcher = (
  url: string,
  init: { signal: AbortSignal; redirect: 'manual' },
) => Promise<Response>

/** An OG image downloaded for the page to serve from `/og-previews/<name>`. */
export type OgImageFile = { name: string; bytes: Uint8Array }

export type OgSnapshot = { previews: OgPreviews; images: OgImageFile[] }

/** Where downloaded OG images are served from, under `public/`. */
export const ogImageDirectory = 'og-previews'

const maxRedirects = 5

/** Raster types only: an SVG served same-origin could carry script. */
const imageExtensions: Partial<Record<string, string>> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

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
    const preview = parseOgPreview(await fetched.response.text(), fetched.url)
    return Object.keys(preview).length > 0 ? preview : undefined
  })
}

/** The body, unless it runs past `maxBytes` (declared or streamed) or is empty. */
async function cappedBody(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array | undefined> {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    return undefined
  }
  const reader = response.body?.getReader()
  if (!reader) return undefined
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return undefined
    }
    chunks.push(value)
  }
  if (size === 0) return undefined
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

function imageOf(
  id: LinkId,
  href: string,
  fetcher: OgFetcher,
  { timeoutMs, maxImageBytes }: { timeoutMs: number; maxImageBytes: number },
): Promise<OgImageFile | undefined> {
  return withinTimeout(timeoutMs, async (signal) => {
    const fetched = await fetchHttps(href, fetcher, signal)
    if (!fetched) return undefined
    const type = fetched.response.headers
      .get('content-type')
      ?.split(';')[0]
      .trim()
      .toLowerCase()
    const extension = type ? imageExtensions[type] : undefined
    if (!extension) return undefined
    const bytes = await cappedBody(fetched.response, maxImageBytes)
    return bytes && { name: `${id}.${extension}`, bytes }
  })
}

function publicImagePath(image: OgImageFile): string {
  return `/${ogImageDirectory}/${image.name}`
}

/** `path` if it is this Link's own downloaded image; never a remote URL. */
function localImage(id: LinkId, path: string | undefined): string | undefined {
  return path?.startsWith(`/${ogImageDirectory}/${id}.`) ? path : undefined
}

async function snapshotEntry(
  link: ConfiguredLink,
  fetcher: OgFetcher,
  last: OgPreview | undefined,
  limits: { timeoutMs: number; maxImageBytes: number },
): Promise<{ preview?: OgPreview; image?: OgImageFile }> {
  const fresh = await previewOf(link.href, fetcher, limits.timeoutMs)
  if (!fresh) {
    return {
      preview:
        last &&
        withoutEmptyFields({ ...last, image: localImage(link.id, last.image) }),
    }
  }

  const { image: remote, ...text } = fresh
  const image = remote
    ? await imageOf(link.id, remote, fetcher, limits)
    : undefined
  const path = image
    ? publicImagePath(image)
    : remote && localImage(link.id, last?.image)
  return { preview: withoutEmptyFields({ ...text, image: path }), image }
}

/**
 * The OG preview snapshot: an entry for every https Link that opts in, and
 * none for any other Link. This is the only place the opt-in is read. Each
 * og:image is downloaded (https, raster, at most `maxImageBytes`) so the page
 * serves it same-origin. Never throws: a failed, slow, or empty destination
 * keeps its `previous` entry, and a failed image keeps its last local copy.
 */
export async function resolveOgPreviews(
  links: ConfiguredLink[],
  fetcher: OgFetcher,
  {
    previous = {},
    timeoutMs = 5000,
    maxImageBytes = 1_000_000,
  }: { previous?: OgPreviews; timeoutMs?: number; maxImageBytes?: number } = {},
): Promise<OgSnapshot> {
  const candidates = links.filter(
    (link) => link.ogPreview && link.href.startsWith('https://'),
  )
  const entries = await Promise.all(
    candidates.map(
      async (link) =>
        [
          link.id,
          await snapshotEntry(link, fetcher, previous[link.id], {
            timeoutMs,
            maxImageBytes,
          }),
        ] as const,
    ),
  )

  const snapshot: OgSnapshot = { previews: {}, images: [] }
  for (const [id, { preview, image }] of entries) {
    if (preview && Object.keys(preview).length > 0)
      snapshot.previews[id] = preview
    if (image) snapshot.images.push(image)
  }
  return snapshot
}
