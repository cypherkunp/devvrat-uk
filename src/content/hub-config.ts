export type LinkId =
  | 'twitter'
  | 'linkedin'
  | 'github'
  | 'central-hub'
  | 'handbook'
  | 'photos'
  | 'resume'

export type ConfiguredLink = {
  id: LinkId
  href: string
  highlighted?: boolean
}

export type HubLink = ConfiguredLink

export type ActionId = 'copy-url' | 'mono' | 'dark'

export const hubOrigin = 'https://devvrat.uk'

/** 308 target when the request host is `www.<apex>`. Vercel's `/:path*` misses `/`. */
export function apexLocation(
  requestUrl: string,
  apex = hubOrigin,
): string | null {
  const url = new URL(requestUrl)
  const apexHost = new URL(apex).hostname
  if (url.hostname !== `www.${apexHost}`) return null
  url.hostname = apexHost
  url.protocol = 'https:'
  return url.href
}

export const resumeHref = 'https://www.devvrat.cc/resume'

export const copyUrlActionId = 'copy-url' as const satisfies ActionId
export const monoActionId = 'mono' as const satisfies ActionId
export const darkActionId = 'dark' as const satisfies ActionId

export const hubLinks: HubLink[] = [
  { id: 'central-hub', href: 'https://devvrat.cc', highlighted: true },
  { id: 'linkedin', href: 'https://www.linkedin.com/in/devvratshukla' },
  { id: 'github', href: 'https://github.com/cypherkunp' },
  { id: 'twitter', href: 'https://x.com/devvrathq' },
  { id: 'handbook', href: 'https://www.devvrat.cc/posts/handbook' },
  { id: 'photos', href: 'https://www.devvrat.cc/photos' },
]
