import type { LinkId } from '#/content/hub-config'
import type { LinkCopy, LinkLocaleCopy } from '#/content/locale'

/** The Open Graph title, description and image of a Link's destination. */
export type OgPreview = {
  title?: string
  description?: string
  image?: string
}

export type OgPreviews = Partial<Record<LinkId, OgPreview>>

/** What a Link tile shows once Locale copy and OG preview are merged. */
export type LinkTileCopy = LinkCopy & {
  description?: string
  image?: string
}

/**
 * Locale copy wins; OG preview fills only what the Locale leaves out. With
 * neither, the title falls back to the label. The handle stays Locale-only.
 */
export function mergeOgPreview(
  copy: LinkLocaleCopy,
  preview: OgPreview = {},
): LinkTileCopy {
  const merged: LinkTileCopy = {
    ...copy,
    title: copy.title ?? preview.title ?? copy.label,
  }
  const description = copy.description ?? preview.description
  if (description) merged.description = description
  if (preview.image) merged.image = preview.image
  return merged
}
