import type { ReactNode } from 'react'
import type { ActionId, LinkId } from '#/content/hub-config'

export type TileArt = {
  /** Mark shown small in the tile chip and oversized as a corner watermark. */
  glyph: ReactNode
  /** Neon the tile is edged with, and the colour of its mark. */
  accent: string
}

function BrandGlyph({ path }: { path: string }) {
  return (
    <svg className="size-full" viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  )
}

function LineGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      className="size-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const tileArt: Record<LinkId | ActionId, TileArt> = {
  email: {
    accent: '#22d3ee',
    glyph: (
      <LineGlyph>
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="m3 6.5 9 6.5 9-6.5" />
      </LineGlyph>
    ),
  },
  twitter: {
    accent: '#f5d0fe',
    glyph: (
      <BrandGlyph path="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
  linkedin: {
    accent: '#38bdf8',
    glyph: (
      <BrandGlyph path="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    ),
  },
  github: {
    accent: '#c084fc',
    glyph: (
      <BrandGlyph path="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    ),
  },
  'central-hub': {
    accent: '#fcee0a',
    glyph: (
      <LineGlyph>
        <circle cx="12" cy="12" r="9.25" />
        <path d="M2.75 12h18.5" />
        <path d="M12 2.75a15.3 15.3 0 0 1 4 9.25 15.3 15.3 0 0 1-4 9.25 15.3 15.3 0 0 1-4-9.25 15.3 15.3 0 0 1 4-9.25z" />
      </LineGlyph>
    ),
  },
  photos: {
    accent: '#ff5ea8',
    glyph: (
      <LineGlyph>
        <rect x="2.75" y="3.75" width="18.5" height="16.5" rx="2" />
        <circle cx="8.5" cy="9" r="1.75" />
        <path d="m3 18 5.5-5.5L21 20" />
      </LineGlyph>
    ),
  },
  'copy-url': {
    accent: '#a3e635',
    glyph: (
      <LineGlyph>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </LineGlyph>
    ),
  },
}
