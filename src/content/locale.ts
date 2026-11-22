import en from './locales/en.json'

export type LocaleId = 'en'

export type LinkCopy = {
  label: string
  title: string
  handle?: string
}

/** A Link as the Locale writes it. Fields left out may come from OG preview. */
export type LinkLocaleCopy = {
  label: string
  title?: string
  description?: string
  handle?: string
}

export type ActionCopy = {
  label: string
  title: string
  success: string
  /** Shown when the clipboard refuses; `{url}` is the hub's host. */
  failure: string
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
    projects: LinkLocaleCopy
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
