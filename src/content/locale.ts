import en from './locales/en.json'

export type LocaleId = 'en'

export type LinkCopy = {
  label: string
  title: string
  handle?: string
}

export type PhotosCopy = LinkCopy & {
  comingSoon: string
}

export type ActionCopy = {
  label: string
  title: string
  success: string
}

export type Locale = {
  identity: {
    role: string
    displayName: string
    bio: string
    availability: string
    portraitAlt: string
  }
  links: {
    email: LinkCopy
    twitter: LinkCopy
    linkedin: LinkCopy
    github: LinkCopy
    'central-hub': LinkCopy
    photos: PhotosCopy
  }
  actions: {
    'copy-url': ActionCopy
  }
  meta: {
    documentTitle: string
  }
}

const locales: Record<LocaleId, Locale> = {
  en,
}

export function loadLocale(id: LocaleId): Locale {
  return locales[id]
}
