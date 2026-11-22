import type { ConfiguredLink, LinkId } from '#/content/hub-config'
import type { LinkCopy, Locale } from '#/content/locale'

/** The Open Graph title, description and image of a Link's destination. */
export type OgPreview = {
  title?: string
  description?: string
  /** A same-origin path under `/og-previews/`, downloaded at build time. */
  image?: string
}

/** The build-time snapshot: entries only for Links that opt in. */
export type OgPreviews = Partial<Record<LinkId, OgPreview>>

/**
 * Locale copy wins; OG preview fills only what the Locale leaves out. With
 * neither, the title falls back to the label. The handle stays Locale-only.
 */
export function mergeOgPreview(
  copy: LinkCopy,
  preview: OgPreview = {},
): LinkCopy {
  const merged: LinkCopy = {
    ...copy,
    title: copy.title ?? preview.title ?? copy.label,
  }
  const description = copy.description ?? preview.description
  if (description) merged.description = description
  const image = copy.image ?? preview.image
  if (image) merged.image = image
  return merged
}

/**
 * The copy a Link's tile shows: its Locale copy (the resume Link titled with
 * the Identity's availability), merged with its OG preview.
 */
export function linkTileCopy(
  link: ConfiguredLink,
  locale: Locale,
  previews: OgPreviews,
): LinkCopy {
  const copy =
    link.id === 'resume'
      ? { ...locale.links.resume, title: locale.identity.availability }
      : locale.links[link.id]
  return mergeOgPreview(copy, previews[link.id])
}
