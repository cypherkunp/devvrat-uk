export type LinkId =
  'email' | 'twitter' | 'linkedin' | 'github' | 'central-hub' | 'photos'

export type ConfiguredLink = {
  id: Exclude<LinkId, 'photos'>
  href: string
  highlighted?: boolean
}

export type PlaceholderLink = {
  id: 'photos'
}

export type HubLink = ConfiguredLink | PlaceholderLink

export type ActionId = 'copy-url'

export const copyUrlActionId: ActionId = 'copy-url'

export const hubLinks: HubLink[] = [
  { id: 'email', href: 'mailto:devvrat.shukla@gmail.com' },
  { id: 'twitter', href: 'https://x.com/devvrathq' },
  { id: 'linkedin', href: 'https://www.linkedin.com/in/devvratshukla' },
  { id: 'github', href: 'https://github.com/cypherkunp' },
  { id: 'central-hub', href: 'https://devvrat.cc', highlighted: true },
  { id: 'photos' },
]
