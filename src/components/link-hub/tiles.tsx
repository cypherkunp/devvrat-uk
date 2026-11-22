import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import type { ConfiguredLink } from '#/content/hub-config'
import type { ActionCopy, LinkCopy } from '#/content/locale'
import { Badge } from '#/components/geist/components'
import { feedbackEnter, feedbackExit } from '#/components/link-hub/motion'
import { tileArt } from '#/components/link-hub/tile-art'
import type { TileArt } from '#/components/link-hub/tile-art'

/** Interactive surface — hover/press are CSS so they stay compositor-friendly. */
export function tileClass({
  staticTile = false,
  align = 'left',
  stackOnDesktop = false,
}: {
  staticTile?: boolean
  align?: 'left' | 'center'
  /** Stack the content on desktop, e.g. an OG preview image above the caption. */
  stackOnDesktop?: boolean
} = {}) {
  return [
    'tile group relative isolate flex h-full w-full px-4 py-7',
    staticTile
      ? 'min-h-24 flex-col'
      : 'min-h-16 flex-row items-center gap-3 md:justify-center',
    stackOnDesktop && !staticTile ? 'lg:flex-col' : '',
    align === 'center'
      ? 'items-start justify-center gap-3 text-left md:items-center md:text-center'
      : staticTile
        ? 'items-start justify-center text-left'
        : 'text-left',
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ds-blue-700)]',
    staticTile ? 'tile-static' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/** An Action's caption: always titled, never a handle. */
type ActionCaption = Pick<ActionCopy, 'label' | 'title'>

function controlLabel({ label, title, handle }: LinkCopy) {
  const name = !title || title === label ? label : `${label}: ${title}`
  return handle ? `${name} (${handle})` : name
}

function TileChip({ art, filled = false }: { art: TileArt; filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-[6px] p-2"
      style={{
        color: filled ? '#fff' : art.accent,
        backgroundColor: filled
          ? art.accent
          : (art.chip ??
            `color-mix(in srgb, ${art.accent} 30%, var(--ds-gray-200))`),
      }}
    >
      {art.glyph}
    </span>
  )
}

function TileRow({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-w-0 max-w-full items-center gap-3">
      {children}
    </span>
  )
}

function TileCaption({
  title,
  description,
  handle,
}: Omit<LinkCopy, 'label' | 'image'>) {
  return (
    <span className="min-w-0">
      <span className="text-label-14 block truncate text-[var(--hub-fg)]">
        {title}
      </span>
      {description ? (
        <span className="tile-description mt-0.5 line-clamp-2 text-[var(--hub-muted)]">
          {description}
        </span>
      ) : null}
      {handle ? (
        <span className="text-label-13-mono mt-0.5 block truncate text-[var(--hub-muted)]">
          {handle}
        </span>
      ) : null}
    </span>
  )
}

/**
 * OG preview image at the OG card ratio (1.91:1). Decorative, since the title
 * already names the Link; sized up front and lazy. Trails the caption on
 * narrow tiles and sits above it on desktop, where tiles have spare height.
 */
function TilePreviewImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      width={122}
      height={64}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="h-10 w-[76px] shrink-0 rounded-[6px] object-cover max-md:ml-auto lg:order-first lg:h-16 lg:w-[122px]"
    />
  )
}

export type Tone = 'ok' | 'error'

/** Feedback an Action shows for a beat in place of its caption. */
export type ActionMessage = { text: string; tone: Tone }

function StatusMessage({ children, tone }: { children: string; tone: Tone }) {
  return (
    <motion.span
      initial={{
        opacity: 0,
        filter: 'blur(2px)',
        transform: 'translateY(4px)',
      }}
      animate={{
        opacity: 1,
        filter: 'blur(0px)',
        transform: 'translateY(0px)',
        transition: feedbackEnter,
      }}
      exit={{
        opacity: 0,
        filter: 'blur(2px)',
        transform: 'translateY(4px)',
        transition: feedbackExit,
      }}
      className="geist-badge justify-self-start"
      data-variant={tone === 'error' ? 'amber' : 'green'}
    >
      {children}
    </motion.span>
  )
}

function CaptionBody({ title }: { title: string }) {
  return (
    <motion.span
      initial={false}
      exit={{
        opacity: 0,
        filter: 'blur(2px)',
        transform: 'translateY(-3px)',
        transition: feedbackExit,
      }}
      className="block"
    >
      <span className="text-label-14 block truncate text-[var(--hub-fg)]">
        {title}
      </span>
    </motion.span>
  )
}

/** The Owner: name leads, role and bio support, portrait anchors the tile. */
export function IdentityTile({
  name,
  role,
  bio,
  portrait,
}: {
  name: string
  role: string
  bio: string
  portrait: ReactNode
}) {
  return (
    <div className="tile tile-static identity-tile">
      <h1 className="identity-name display-title m-0 min-w-0 text-[var(--hub-fg)]">
        {name}
      </h1>
      <span className="identity-role min-w-0">
        <Badge variant="gray" contrast="low">
          {role}
        </Badge>
      </span>
      <p className="identity-bio text-copy-16 m-0 min-w-0 text-[var(--hub-muted)]">
        {bio}
      </p>
      <span className="identity-portrait">{portrait}</span>
    </div>
  )
}

export function LinkTile({
  link,
  copy,
  onActivate,
}: {
  link: ConfiguredLink
  copy: LinkCopy
  onActivate: () => void
}) {
  const art = tileArt[link.id]
  const external = link.href.startsWith('http')

  return (
    <a
      href={link.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      aria-label={controlLabel(copy)}
      data-highlighted={link.highlighted ? 'true' : undefined}
      className={tileClass({ stackOnDesktop: Boolean(copy.image) })}
      onClick={onActivate}
    >
      <TileRow>
        <TileChip art={art} filled={link.highlighted} />
        <TileCaption
          title={copy.title}
          description={copy.description}
          handle={copy.handle}
        />
      </TileRow>
      {copy.image ? <TilePreviewImage src={copy.image} /> : null}
    </a>
  )
}

/** Actions are about the page, not the Owner: slim controls in one band, no chips. */
const actionClass = [
  'hub-action group flex min-h-12 min-w-0 flex-1 items-center gap-2 px-4 text-left',
  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ds-blue-700)]',
].join(' ')

function ActionGlyph({ art }: { art: TileArt }) {
  return (
    <span
      aria-hidden="true"
      className="hub-action-glyph flex size-4 shrink-0 text-[var(--hub-muted)]"
    >
      {art.glyph}
    </span>
  )
}

export function ActionButton({
  art,
  copy,
  message,
  onActivate,
}: {
  art: TileArt
  copy: ActionCaption
  message: ActionMessage | null
  onActivate: () => void
}) {
  return (
    <button
      type="button"
      aria-label={controlLabel(copy)}
      className={actionClass}
      onClick={onActivate}
    >
      <ActionGlyph art={art} />
      {/*
        One grid cell: caption and status cross-fade in place, so the row never
        grows. The status region is always mounted so screen readers hear the
        message when it arrives, not only when the region itself appears.
      */}
      <span className="grid min-w-0 items-center [&>*]:[grid-area:1/1]">
        <AnimatePresence initial={false}>
          {message ? null : <CaptionBody key="caption" title={copy.title} />}
        </AnimatePresence>
        <span role="status" className="grid min-w-0 items-center">
          <AnimatePresence initial={false}>
            {message ? (
              <StatusMessage key={message.tone} tone={message.tone}>
                {message.text}
              </StatusMessage>
            ) : null}
          </AnimatePresence>
        </span>
      </span>
    </button>
  )
}

function GeistToggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="geist-toggle"
      data-on={on ? '' : undefined}
    />
  )
}

export function ActionSwitch({
  art,
  copy,
  checked,
  onCheckedChange,
}: {
  art: TileArt
  copy: ActionCaption
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={controlLabel(copy)}
      className={actionClass}
      onClick={() => onCheckedChange(!checked)}
    >
      <ActionGlyph art={art} />
      <span className="text-label-14 min-w-0 flex-1 truncate text-[var(--hub-fg)]">
        {copy.title}
      </span>
      <GeistToggle on={checked} />
    </button>
  )
}
