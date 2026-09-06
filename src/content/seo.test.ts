import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { hubOrigin, resumeHref } from '#/content/hub-config'
import { loadLocale } from '#/content/locale'
import {
  linkHubHead,
  linkHubJsonLd,
  ownerEmail,
  ownerSameAsUrls,
} from '#/content/seo'

const locale = loadLocale('en')

describe('crawl files', () => {
  it('lets crawlers in and points at the sitemap', () => {
    const robots = readFileSync('public/robots.txt', 'utf8')

    expect(robots).toMatch(/User-agent:\s*\*/)
    expect(robots).toMatch(/Allow:\s*\//)
    expect(robots).toContain(`Sitemap: ${hubOrigin}/sitemap.xml`)
  })

  it('lists only the Link Hub origin in the sitemap', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8')

    expect(sitemap).toContain(`<loc>${hubOrigin}/</loc>`)
    expect(sitemap.match(/<loc>/g)).toHaveLength(1)
  })

  it('permanently redirects www to the Link Hub apex and sets HSTS includeSubDomains', () => {
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      redirects: Array<{
        destination: string
        permanent?: boolean
        source?: string
        has?: Array<{ type: string; value: string }>
      }>
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }

    const wwwRedirect = vercel.redirects.find((redirect) => {
      const toApex = redirect.destination.startsWith(`${hubOrigin}/`)
      const fromWwwHost = redirect.has?.some(
        (condition) =>
          condition.type === 'host' && condition.value === 'www.devvrat.uk',
      )
      const fromWwwSource = redirect.source?.includes('www.devvrat.uk')
      return toApex && (fromWwwHost || fromWwwSource)
    })

    expect(wwwRedirect?.permanent).toBe(true)

    const hsts = vercel.headers
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === 'Strict-Transport-Security')

    expect(hsts?.value).toContain('includeSubDomains')
  })
})

describe('Owner Identity markup', () => {
  it('takes sameAs from https Links and the resume, skipping mailto and Photos', () => {
    expect(ownerEmail()).toBe('devvrat.shukla@gmail.com')
    expect(ownerSameAsUrls()).toEqual([
      'https://x.com/devvrathq',
      'https://www.linkedin.com/in/devvratshukla',
      'https://github.com/cypherkunp',
      'https://devvrat.cc',
      'https://www.devvrat.cc/posts/handbook',
      resumeHref,
    ])
  })

  it('builds Person and WebSite JSON-LD from Identity and Locale', () => {
    const data = linkHubJsonLd(locale)
    const graph = data['@graph'] as Array<Record<string, unknown>>
    const website = graph.find((node) => node['@type'] === 'WebSite')
    const person = graph.find((node) => node['@type'] === 'Person')

    expect(website).toMatchObject({
      url: `${hubOrigin}/`,
      name: locale.identity.displayName,
      description: locale.meta.description,
    })
    expect(person).toMatchObject({
      name: locale.identity.displayName,
      jobTitle: locale.identity.role,
      description: locale.identity.bio,
      email: 'devvrat.shukla@gmail.com',
      image: `${hubOrigin}/portrait.jpg`,
      sameAs: ownerSameAsUrls(),
    })
  })

  it('exposes description, canonical, and share tags for the homepage', () => {
    const head = linkHubHead(locale)

    expect(head.meta).toContainEqual({
      name: 'description',
      content: locale.meta.description,
    })
    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: `${hubOrigin}/`,
    })
    expect(head.meta).toContainEqual({
      property: 'og:title',
      content: locale.meta.documentTitle,
    })
    expect(head.scripts[0]?.type).toBe('application/ld+json')
    expect(JSON.parse(head.scripts[0]!.children)).toEqual(linkHubJsonLd(locale))
  })
})
