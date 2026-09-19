import en from './locales/en.json'

export type LocaleId = 'en'

export type LinkCopy = {
  label: string
  title: string
  handle?: string
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
    bioLabel: string
    availability: string
    portraitAlt: string
  }
  links: {
    twitter: LinkCopy
    linkedin: LinkCopy
    github: LinkCopy
    'central-hub': LinkCopy
    handbook: LinkCopy
    photos: LinkCopy
    resume: LinkCopy
  }
  actions: {
    'copy-url': ActionCopy
    mono: Pick<ActionCopy, 'label' | 'title'>
    dark: Pick<ActionCopy, 'label' | 'title'>
  }
  footer: {
    credit: string
    rights: string
  }
  notFound: {
    code: string
    heading: string
    redirect: string
  }
  meta: {
    documentTitle: string
    description: string
  }
}

const locales: Record<LocaleId, Locale> = {
  en,
}

export function loadLocale(id: LocaleId): Locale {
  return locales[id]
}
