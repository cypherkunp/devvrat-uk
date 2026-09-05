import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react/dist/lib/types'
import { BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen'
import { BriefcaseIcon } from '@phosphor-icons/react/dist/ssr/Briefcase'
import { CircleHalfIcon } from '@phosphor-icons/react/dist/ssr/CircleHalf'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { GithubLogoIcon } from '@phosphor-icons/react/dist/ssr/GithubLogo'
import { GlobeSimpleIcon } from '@phosphor-icons/react/dist/ssr/GlobeSimple'
import { ImageIcon } from '@phosphor-icons/react/dist/ssr/Image'
import { LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple'
import { LinkedinLogoIcon } from '@phosphor-icons/react/dist/ssr/LinkedinLogo'
import { MoonIcon } from '@phosphor-icons/react/dist/ssr/Moon'
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr/XLogo'
import type { ActionId, LinkId } from '#/content/hub-config'

export type TileArt = {
  /** Mark shown small in the tile chip. */
  glyph: ReactNode
  /** Accent for the glyph. */
  accent: string
  /** Chip fill. Defaults to a tint of `accent` on gray-200. */
  chip?: string
}

function mark(Icon: Icon) {
  return <Icon aria-hidden className="size-full" size="100%" weight="bold" />
}

export const tileArt: Record<LinkId | ActionId, TileArt> = {
  resume: {
    accent: '#34c759',
    glyph: mark(BriefcaseIcon),
  },
  email: {
    accent: '#0071e3',
    glyph: mark(EnvelopeSimpleIcon),
  },
  twitter: {
    accent: 'var(--ds-gray-1000)',
    chip: 'var(--ds-gray-600)',
    glyph: mark(XLogoIcon),
  },
  linkedin: {
    accent: '#0a66c2',
    glyph: mark(LinkedinLogoIcon),
  },
  github: {
    accent: 'var(--ds-gray-1000)',
    chip: 'var(--ds-gray-600)',
    glyph: mark(GithubLogoIcon),
  },
  'central-hub': {
    accent: '#0071e3',
    glyph: mark(GlobeSimpleIcon),
  },
  handbook: {
    accent: '#bf4800',
    glyph: mark(BookOpenIcon),
  },
  photos: {
    accent: '#bf5af2',
    glyph: mark(ImageIcon),
  },
  'copy-url': {
    accent: '#34c759',
    glyph: mark(LinkSimpleIcon),
  },
  mono: {
    accent: '#6e6e73',
    glyph: mark(CircleHalfIcon),
  },
  dark: {
    accent: '#0a84ff',
    glyph: mark(MoonIcon),
  },
}
