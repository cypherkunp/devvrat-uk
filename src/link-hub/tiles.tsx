import { AnimatePresence, motion } from 'motion/react'

import type { ConfiguredLink } from '#/content/hub-config'
import type { LinkCopy } from '#/content/locale'
import { feedbackEnter, feedbackExit } from '#/link-hub/motion'
import { tileArt } from '#/link-hub/tile-art'
import type { TileArt } from '#/link-hub/tile-art'

/** Interactive surface — hover/press are CSS so they stay compositor-friendly. */
export function tileClass() {
  return [
    'tile group relative isolate flex h-full min-h-24 w-full flex-col px-4 py-3.5 text-left',
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ds-blue-700)]',
  ].join(' ')
}

function controlLabel({ label, title }: Pick<LinkCopy, 'label' | 'title'>) {
  return `${label}: ${title}`
}

function TileChip({ art }: { art: TileArt }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-[6px] p-1.5"
      style={{
        color: art.accent,
        backgroundColor: `${art.accent}1f`,
      }}
    >
      {art.glyph}
    </span>
  )
}

function TileArrow() {
  return (
    <span
      aria-hidden="true"
      className="tile-arrow shrink-0 text-[var(--hub-muted)]"
    >
      ↗
    </span>
  )
}

function TileLabel({ label }: Pick<LinkCopy, 'label'>) {
  return (
    <span className="text-label-13 min-w-0 flex-1 truncate text-[var(--hub-muted)]">
      {label}
    </span>
  )
}

function TileCaption({ title, handle }: Omit<LinkCopy, 'label'>) {
  return (
    <span className="mt-auto block pt-5">
      <span className="text-label-14 block text-[var(--hub-fg)]">{title}</span>
      {handle ? (
        <span className="text-label-13-mono mt-0.5 block text-[var(--hub-muted)]">
          {handle}
        </span>
      ) : null}
    </span>
  )
}

export type Tone = 'pending' | 'ok'

const toneClass: Record<Tone, string> = {
  pending: 'geist-badge',
  ok: 'geist-badge',
}

function StatusMessage({ children, tone }: { children: string; tone: Tone }) {
  return (
    <motion.span
      role="status"
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
      className={toneClass[tone]}
      data-variant={tone === 'pending' ? 'amber' : 'green'}
    >
      {children}
    </motion.span>
  )
}

function CaptionBody({ title, handle }: Omit<LinkCopy, 'label'>) {
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
      <span className="text-label-14 block text-[var(--hub-fg)]">{title}</span>
      {handle ? (
        <span className="text-label-13-mono mt-0.5 block text-[var(--hub-muted)]">
          {handle}
        </span>
      ) : null}
    </motion.span>
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
      className={tileClass()}
      onClick={onActivate}
    >
      <span className="flex items-center gap-3">
        <TileChip art={art} />
        <TileLabel label={copy.label} />
        <TileArrow />
      </span>
      <TileCaption title={copy.title} handle={copy.handle} />
    </a>
  )
}

export function ButtonTile({
  art,
  copy,
  message,
  tone,
  onActivate,
}: {
  art: TileArt
  copy: LinkCopy
  message: string | null
  tone: Tone
  onActivate: () => void
}) {
  return (
    <button
      type="button"
      aria-label={controlLabel(copy)}
      className={tileClass()}
      onClick={onActivate}
    >
      <span className="flex items-center gap-3">
        <TileChip art={art} />
        <TileLabel label={copy.label} />
      </span>
      <span className="mt-auto block min-h-[2.75rem] pt-5">
        <AnimatePresence initial={false}>
          {message ? (
            <StatusMessage key="status" tone={tone}>
              {message}
            </StatusMessage>
          ) : (
            <CaptionBody
              key="caption"
              title={copy.title}
              handle={copy.handle}
            />
          )}
        </AnimatePresence>
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

export function SwitchTile({
  art,
  copy,
  checked,
  onCheckedChange,
}: {
  art: TileArt
  copy: LinkCopy
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={controlLabel(copy)}
      className={tileClass()}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="flex items-center gap-3">
        <TileChip art={art} />
        <TileLabel label={copy.label} />
      </span>
      <span className="mt-auto flex items-end justify-between gap-3 pt-5">
        <span className="text-label-14 text-[var(--hub-fg)]">{copy.title}</span>
        <GeistToggle on={checked} />
      </span>
    </button>
  )
}

/** Static mark — availability is Locale copy, not a live signal. */
export function AvailabilityPulse() {
  return (
    <span
      aria-hidden="true"
      className="size-1.5 shrink-0 rounded-full bg-[var(--hub-ok)]"
    />
  )
}
