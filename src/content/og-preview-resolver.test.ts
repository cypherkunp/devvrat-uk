import { describe, expect, it } from 'vitest'

import type { ConfiguredLink } from '#/content/hub-config'
import { resolveOgPreviews } from '#/content/og-preview-resolver'
import type { OgFetcher } from '#/content/og-preview-resolver'

const projects: ConfiguredLink = {
  id: 'projects',
  href: 'https://cypherkunp.github.io/',
  ogPreview: true,
}

const card = 'https://cypherkunp.github.io/og.png'
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])

function png(
  bytes: Uint8Array<ArrayBuffer> = pngBytes,
  headers: HeadersInit = {},
) {
  return new Response(bytes, {
    headers: { 'content-type': 'image/png', ...headers },
  })
}

/** Serves `routes[url]`, or `html` for any other URL. */
function siteFetcher(
  html: string,
  routes: Partial<Record<string, () => Response>> = {},
  requested: string[] = [],
): OgFetcher {
  return async (url) => {
    requested.push(url)
    return routes[url]?.() ?? new Response(html, { status: 200 })
  }
}

describe('OG preview resolution', () => {
  it('reads og title, description and image from an opted-in Link', async () => {
    const fetcher = siteFetcher(
      `<html><head>
      <meta property="og:title" content="Devvrat · Projects">
      <meta property="og:description" content="Projects &amp; history.">
      <meta property="og:image" content="${card}">
      <title>Ignored</title>
    </head></html>`,
      { [card]: () => png() },
    )

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({
      previews: {
        projects: {
          title: 'Devvrat · Projects',
          description: 'Projects & history.',
          image: '/og-previews/projects.png',
        },
      },
      images: [{ name: 'projects.png', bytes: pngBytes }],
    })
  })

  it('falls back to the document title and meta description without og tags', async () => {
    const fetcher = siteFetcher(`<html><head>
      <title>  Projects
        site </title>
      <meta name="description" content="Things I built.">
    </head></html>`)

    expect((await resolveOgPreviews([projects], fetcher)).previews).toEqual({
      projects: { title: 'Projects site', description: 'Things I built.' },
    })
  })

  it('resolves a relative og image against the destination', async () => {
    const requested: string[] = []
    const fetcher = siteFetcher(
      '<meta content="/img/card.jpg" property="og:image">',
      {
        'https://cypherkunp.github.io/img/card.jpg': () =>
          png(pngBytes, { 'content-type': 'image/jpeg' }),
      },
      requested,
    )

    const { previews } = await resolveOgPreviews(
      [{ ...projects, href: 'https://cypherkunp.github.io/work/' }],
      fetcher,
    )

    expect(requested).toContain('https://cypherkunp.github.io/img/card.jpg')
    expect(previews).toEqual({
      projects: { image: '/og-previews/projects.jpg' },
    })
  })

  it('rejects an og image that is not https', async () => {
    const requested: string[] = []
    const fetcher = siteFetcher(
      `
      <meta property="og:title" content="Projects">
      <meta property="og:image" content="http://example.com/card.png">`,
      {},
      requested,
    )

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({
      previews: { projects: { title: 'Projects' } },
      images: [],
    })
    expect(requested).toEqual([projects.href])
  })

  it('fetches only https destinations of Links that opt in', async () => {
    const requested: string[] = []
    const fetcher: OgFetcher = async (url) => {
      requested.push(url)
      return new Response('<title>Somewhere</title>')
    }

    const { previews } = await resolveOgPreviews(
      [
        { ...projects, href: 'http://cypherkunp.github.io/' },
        { id: 'github', href: 'https://github.com/cypherkunp' },
        {
          id: 'photos',
          href: 'https://www.devvrat.cc/photos',
          ogPreview: true,
        },
      ],
      fetcher,
    )

    expect(requested).toEqual(['https://www.devvrat.cc/photos'])
    expect(previews).toEqual({ photos: { title: 'Somewhere' } })
  })

  it('gives no preview, without throwing, when a destination fails or stalls', async () => {
    const links: ConfiguredLink[] = [
      projects,
      { id: 'photos', href: 'https://www.devvrat.cc/photos', ogPreview: true },
      {
        id: 'handbook',
        href: 'https://www.devvrat.cc/posts/handbook',
        ogPreview: true,
      },
      { id: 'github', href: 'https://github.com/cypherkunp', ogPreview: true },
    ]
    const fetcher: OgFetcher = async (url) => {
      if (url === projects.href) throw new TypeError('fetch failed')
      if (url.endsWith('/photos'))
        return new Response('<title>Gone</title>', { status: 500 })
      if (url.endsWith('/handbook')) return new Promise<Response>(() => {})
      return new Response('<p>No head tags here</p>')
    }

    await expect(
      resolveOgPreviews(links, fetcher, { timeoutMs: 20 }),
    ).resolves.toEqual({ previews: {}, images: [] })
  })

  it('keeps the last snapshot entry of an opted-in Link whose destination fails', async () => {
    const fetcher: OgFetcher = async () => {
      throw new TypeError('fetch failed')
    }

    expect(
      (
        await resolveOgPreviews([projects], fetcher, {
          previous: {
            projects: { title: 'Last known' },
            github: { title: 'No longer opted in' },
          },
        })
      ).previews,
    ).toEqual({ projects: { title: 'Last known' } })
  })
})

describe('OG preview images', () => {
  const page = `<title>Projects</title><meta property="og:image" content="${card}">`

  async function imageOf(
    image: () => Response | Promise<Response>,
    options: Parameters<typeof resolveOgPreviews>[2] = {},
  ) {
    const fetcher: OgFetcher = async (url) =>
      url === card ? image() : new Response(page)
    return resolveOgPreviews([projects], fetcher, options)
  }

  it('drops an image that is not a raster image type', async () => {
    for (const type of ['text/html', 'image/svg+xml', '']) {
      const { previews, images } = await imageOf(() =>
        png(pngBytes, { 'content-type': type }),
      )
      expect(previews).toEqual({ projects: { title: 'Projects' } })
      expect(images).toEqual([])
    }
  })

  it('drops an image over the size limit, declared or not', async () => {
    const big = new Uint8Array(1_000_001)
    const declared = await imageOf(() =>
      png(new Uint8Array(1), { 'content-length': String(big.byteLength) }),
    )
    const streamed = await imageOf(() => png(big))
    const atLimit = await imageOf(() => png(new Uint8Array(1_000_000)))

    expect(declared.images).toEqual([])
    expect(streamed.images).toEqual([])
    expect(atLimit.previews.projects?.image).toBe('/og-previews/projects.png')
  })

  it('drops an image whose redirect leaves https', async () => {
    const { images } = await imageOf(
      () =>
        new Response(null, {
          status: 302,
          headers: { location: 'http://cypherkunp.github.io/og.png' },
        }),
    )

    expect(images).toEqual([])
  })

  it('keeps the last local image when the download fails, never a remote one', async () => {
    const failing = () => new Response('nope', { status: 404 })

    const local = await imageOf(failing, {
      previous: { projects: { image: '/og-previews/projects.webp' } },
    })
    const remote = await imageOf(failing, {
      previous: { projects: { image: card } },
    })
    const pageDown = await resolveOgPreviews(
      [projects],
      async () => {
        throw new TypeError('fetch failed')
      },
      { previous: { projects: { title: 'Projects', image: card } } },
    )

    expect(local.previews).toEqual({
      projects: { title: 'Projects', image: '/og-previews/projects.webp' },
    })
    expect(remote.previews).toEqual({ projects: { title: 'Projects' } })
    expect(pageDown.previews).toEqual({ projects: { title: 'Projects' } })
  })
})

describe('OG preview redirects', () => {
  function redirect(location: string) {
    return new Response(null, { status: 301, headers: { location } })
  }

  it('follows https redirects and asks the fetcher not to follow them itself', async () => {
    const requested: string[] = []
    const fetcher: OgFetcher = async (url, init) => {
      requested.push(`${init.redirect} ${url}`)
      if (url === projects.href) return redirect('/home')
      return new Response('<title>Home</title>')
    }

    expect((await resolveOgPreviews([projects], fetcher)).previews).toEqual({
      projects: { title: 'Home' },
    })
    expect(requested).toEqual([
      'manual https://cypherkunp.github.io/',
      'manual https://cypherkunp.github.io/home',
    ])
  })

  it('gives no preview when a redirect leaves https', async () => {
    const requested: string[] = []
    const fetcher: OgFetcher = async (url) => {
      requested.push(url)
      return url === projects.href
        ? redirect('http://cypherkunp.github.io/')
        : new Response('<title>Insecure</title>')
    }

    expect((await resolveOgPreviews([projects], fetcher)).previews).toEqual({})
    expect(requested).toEqual([projects.href])
  })

  it('gives no preview after too many redirects', async () => {
    let hops = 0
    const fetcher: OgFetcher = async () => redirect(`/hop-${++hops}`)

    expect((await resolveOgPreviews([projects], fetcher)).previews).toEqual({})
    expect(hops).toBeLessThanOrEqual(6)
  })

  it('gives no preview when the fetcher ends up off https anyway', async () => {
    const fetcher: OgFetcher = async () => {
      const response = new Response('<title>Followed</title>')
      Object.defineProperty(response, 'url', {
        value: 'http://cypherkunp.github.io/',
      })
      return response
    }

    expect((await resolveOgPreviews([projects], fetcher)).previews).toEqual({})
  })
})
