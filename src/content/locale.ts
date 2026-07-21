import en from './locales/en.json'

export type LocaleId = 'en'

export type Locale = {
  identity: {
    role: string
    displayName: string
    bio: string
    availability: string
    portraitAlt: string
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
