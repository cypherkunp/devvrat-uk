import {
  hubLinks,
  hubOrigin,
  resumeHref,
  type ConfiguredLink,
  type HubLink,
} from '#/content/hub-config'
import type { Locale } from '#/content/locale'

function isConfigured(link: HubLink): link is ConfiguredLink {
  return 'href' in link
}

function isIdentityProfileUrl(href: string) {
  return (
    href.startsWith('https://') && !new URL(href).pathname.includes('/posts/')
  )
}

export function ownerEmail(links: HubLink[] = hubLinks): string | undefined {
  const mailto = links
    .filter(isConfigured)
    .find((link) => link.href.startsWith('mailto:'))
  return mailto?.href.slice('mailto:'.length)
}

export function ownerSameAsUrls(
  links: HubLink[] = hubLinks,
  resume = resumeHref,
): string[] {
  const urls = links
    .filter(isConfigured)
    .map((link) => link.href)
    .filter(isIdentityProfileUrl)

  if (!urls.includes(resume)) urls.push(resume)
  return urls
}

export function linkHubJsonLd(
  locale: Locale,
  origin = hubOrigin,
): Record<string, unknown> {
  const url = `${origin}/`
  const email = ownerEmail()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${origin}/#page`,
        url,
        name: locale.meta.documentTitle,
        isPartOf: { '@id': `${origin}/#website` },
        mainEntity: { '@id': `${origin}/#person` },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url,
        name: locale.identity.displayName,
        description: locale.meta.description,
        inLanguage: 'en',
        publisher: { '@id': `${origin}/#person` },
      },
      {
        '@type': 'Person',
        '@id': `${origin}/#person`,
        name: locale.identity.displayName,
        url,
        jobTitle: locale.identity.role,
        description: locale.identity.bio,
        ...(email ? { email } : {}),
        image: `${origin}/portrait.jpg`,
        sameAs: ownerSameAsUrls(),
        mainEntityOfPage: { '@id': `${origin}/#page` },
      },
    ],
  }
}

export function linkHubHead(locale: Locale, origin = hubOrigin) {
  const url = `${origin}/`
  const shareImage = `${origin}/og.jpg`
  const { documentTitle, description } = locale.meta

  return {
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'profile' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: documentTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: shareImage },
      { property: 'og:image:alt', content: locale.identity.portraitAlt },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '1200' },
      { property: 'og:site_name', content: 'Devvrat' },
      { property: 'og:locale', content: 'en_GB' },
      { property: 'profile:first_name', content: 'Devvrat' },
      { property: 'profile:username', content: 'devvrathq' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: documentTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: shareImage },
      { name: 'twitter:image:alt', content: locale.identity.portraitAlt },
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(linkHubJsonLd(locale, origin)),
      },
    ],
  }
}
