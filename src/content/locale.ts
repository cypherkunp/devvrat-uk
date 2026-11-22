import en from './locales/en.json'

export type LocaleId = 'en'

/**
 * What a Link tile shows. The Locale writes the label and handle; any of
 * title, description and image it leaves out may come from OG preview.
 */
export type LinkCopy = {
  label: string
  title?: string
  description?: string
  /** A same-origin path; the Locale leaves it to OG preview. */
  image?: string
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
    /** No title, so the tile shows the OG preview title. */
    projects: LinkCopy
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
    /** 110-160 characters: the range search results and link unfurls show in full. */
    description: string
    /** Alt text for the share image, which carries text the portrait alt does not. */
    shareImageAlt: string
  }
}

const locales: Record<LocaleId, Locale> = {
  en,
}

export function loadLocale(id: LocaleId): Locale {
  return locales[id]
}
