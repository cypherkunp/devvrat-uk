import { describe, expect, it } from 'vitest'

import type { ConfiguredLink } from '#/content/hub-config'
import { resolveOgPreviews } from '#/content/og-preview-resolver'
import type { OgFetcher } from '#/content/og-preview-resolver'

const projects: ConfiguredLink = {
  id: 'projects',
  href: 'https://cypherkunp.github.io/',
  ogPreview: true,
}

function htmlFetcher(html: string): OgFetcher {
  return async () => new Response(html, { status: 200 })
}

describe('OG preview resolution', () => {
  it('reads og title, description and image from an opted-in Link', async () => {
    const fetcher = htmlFetcher(`<html><head>
      <meta property="og:title" content="Devvrat · Projects">
      <meta property="og:description" content="Projects &amp; history.">
      <meta property="og:image" content="https://avatars.githubusercontent.com/u/1">
      <title>Ignored</title>
    </head></html>`)

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({
      projects: {
        title: 'Devvrat · Projects',
        description: 'Projects & history.',
        image: 'https://avatars.githubusercontent.com/u/1',
      },
    })
  })

  it('falls back to the document title and meta description without og tags', async () => {
    const fetcher = htmlFetcher(`<html><head>
      <title>  Projects
        site </title>
      <meta name="description" content="Things I built.">
    </head></html>`)

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({
      projects: { title: 'Projects site', description: 'Things I built.' },
    })
  })

  it('resolves a relative og image against the destination', async () => {
    const fetcher = htmlFetcher(
      '<meta content="/img/card.png" property="og:image">',
    )

    expect(
      await resolveOgPreviews(
        [{ ...projects, href: 'https://cypherkunp.github.io/work/' }],
        fetcher,
      ),
    ).toEqual({
      projects: { image: 'https://cypherkunp.github.io/img/card.png' },
    })
  })

  it('rejects an og image that is not https', async () => {
    const fetcher = htmlFetcher(`
      <meta property="og:title" content="Projects">
      <meta property="og:image" content="http://example.com/card.png">`)

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({
      projects: { title: 'Projects' },
    })
  })

  it('fetches only https destinations of Links that opt in', async () => {
    const requested: string[] = []
    const fetcher: OgFetcher = async (url) => {
      requested.push(url)
      return new Response('<title>Somewhere</title>')
    }

    const previews = await resolveOgPreviews(
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
    ).resolves.toEqual({})
  })

  it('keeps the last snapshot entry of an opted-in Link whose destination fails', async () => {
    const fetcher: OgFetcher = async () => {
      throw new TypeError('fetch failed')
    }

    expect(
      await resolveOgPreviews([projects], fetcher, {
        previous: {
          projects: { title: 'Last known' },
          github: { title: 'No longer opted in' },
        },
      }),
    ).toEqual({ projects: { title: 'Last known' } })
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

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({
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

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({})
    expect(requested).toEqual([projects.href])
  })

  it('gives no preview after too many redirects', async () => {
    let hops = 0
    const fetcher: OgFetcher = async () => redirect(`/hop-${++hops}`)

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({})
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

    expect(await resolveOgPreviews([projects], fetcher)).toEqual({})
  })
})
