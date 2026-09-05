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
    .filter((href) => href.startsWith('https://'))

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
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url,
        name: locale.identity.displayName,
        description: locale.meta.description,
        inLanguage: 'en',
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
      },
    ],
  }
}

export function linkHubHead(locale: Locale, origin = hubOrigin) {
  const url = `${origin}/`
  const image = `${origin}/portrait.jpg`
  const { documentTitle, description } = locale.meta

  return {
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'profile' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: documentTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: locale.identity.portraitAlt },
      { property: 'og:locale', content: 'en_GB' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: documentTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
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
