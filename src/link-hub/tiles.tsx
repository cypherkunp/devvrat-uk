import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import type { ConfiguredLink } from '#/content/hub-config'
import type { LinkCopy } from '#/content/locale'
import {
  easeOut,
  feedbackTransition,
  itemVariants,
} from '#/link-hub/motion'
import { tileArt } from '#/link-hub/tile-art'
import type { TileArt } from '#/link-hub/tile-art'

/** Interactive surface — hover/press are CSS so they stay compositor-friendly
 *  and don't fight Motion's entrance transform on the wrapper. */
export function tileClass() {
  return [
    'tile group relative isolate flex h-full min-h-24 w-full flex-col rounded-2xl px-4 py-3.5 text-left',
    'material',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hub-accent)]',
  ].join(' ')
}

function cellClass(highlighted?: boolean) {
  return highlighted ? 'sm:col-span-2' : undefined
}

function controlLabel({ label, title }: Pick<LinkCopy, 'label' | 'title'>) {
  return `${label}: ${title}`
}

function TileSurface({ art, wide }: { art: TileArt; wide?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl"
    >
      <span
        className={`tile-glyph absolute -right-6 -bottom-8 size-24 opacity-[0.07] lg:size-28 ${
          wide ? 'lg:size-36' : ''
        }`}
        style={{ color: art.accent }}
      >
        {art.glyph}
      </span>
    </span>
  )
}

function TileChip({ art }: { art: TileArt }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-[0.65rem] p-2"
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
    <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium tracking-[0.01em] text-[var(--hub-muted)]">
      {label}
    </span>
  )
}

function TileCaption({ title, handle }: Omit<LinkCopy, 'label'>) {
  return (
    <span className="mt-auto block pt-5">
      <span className="block text-[1.0625rem] font-semibold tracking-[-0.015em] text-[var(--hub-fg)]">
        {title}
      </span>
      {handle ? (
        <span className="mt-0.5 block text-[0.8125rem] tracking-[0.01em] text-[var(--hub-muted)]">
          {handle}
        </span>
      ) : null}
    </span>
  )
}

export type Tone = 'pending' | 'ok'

const toneClass: Record<Tone, string> = {
  pending:
    'bg-[color-mix(in_srgb,var(--hub-pending)_14%,white)] text-[#9a6700]',
  ok: 'bg-[color-mix(in_srgb,var(--hub-ok)_14%,white)] text-[#1b7a36]',
}

/** Same-direction enter/exit + scale floor — spatial consistency, no scale(0). */
function StatusMessage({ children, tone }: { children: string; tone: Tone }) {
  return (
    <motion.span
      role="status"
      initial={{ opacity: 0, transform: 'translateY(6px) scale(0.96)' }}
      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      exit={{ opacity: 0, transform: 'translateY(6px) scale(0.96)' }}
      transition={feedbackTransition}
      className={`absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.01em] ${toneClass[tone]}`}
    >
      {children}
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
    <motion.div variants={itemVariants} className={cellClass(link.highlighted)}>
      <a
        href={link.href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-label={controlLabel(copy)}
        data-highlighted={link.highlighted ? 'true' : undefined}
        className={tileClass()}
        onClick={onActivate}
      >
        <TileSurface art={art} wide={link.highlighted} />
        <span className="flex items-center gap-3">
          <TileChip art={art} />
          <TileLabel label={copy.label} />
          <TileArrow />
        </span>
        <TileCaption title={copy.title} handle={copy.handle} />
      </a>
    </motion.div>
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
    <motion.div variants={itemVariants}>
      <button
        type="button"
        aria-label={controlLabel(copy)}
        className={tileClass()}
        onClick={onActivate}
      >
        <TileSurface art={art} />
        <span className="flex items-center gap-3">
          <TileChip art={art} />
          <TileLabel label={copy.label} />
        </span>
        <TileCaption title={copy.title} handle={copy.handle} />
        <AnimatePresence>
          {message ? (
            <StatusMessage tone={tone}>{message}</StatusMessage>
          ) : null}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

function AppleSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-[1.75rem] w-[3.1rem] shrink-0 rounded-full transition-[background-color] duration-200"
      style={{
        backgroundColor: on ? 'var(--hub-ok)' : 'rgba(120, 120, 128, 0.32)',
        transitionTimingFunction: 'var(--ease-out)',
      }}
    >
      <span
        className="absolute top-[0.125rem] size-[1.5rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22),0_1px_1px_rgba(0,0,0,0.12)] transition-transform duration-200"
        style={{
          transform: on ? 'translateX(1.35rem)' : 'translateX(0.125rem)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      />
    </span>
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
    <motion.div variants={itemVariants}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={controlLabel(copy)}
        className={tileClass()}
        onClick={() => onCheckedChange(!checked)}
      >
        <TileSurface art={art} />
        <span className="flex items-center gap-3">
          <TileChip art={art} />
          <TileLabel label={copy.label} />
        </span>
        <span className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="block text-[1.0625rem] font-semibold tracking-[-0.015em] text-[var(--hub-fg)]">
            {copy.title}
          </span>
          <AppleSwitch on={checked} />
        </span>
      </button>
    </motion.div>
  )
}

export function AvailabilityPulse() {
  const reduceMotion = useReducedMotion()

  return (
    <span aria-hidden="true" className="relative flex size-2 shrink-0">
      {/* Ring always in the tree so SSR and client markup match. */}
      <motion.span
        className="absolute inset-0 rounded-full bg-[var(--hub-ok)]"
        initial={{ opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 0 }
            : {
                transform: ['scale(1)', 'scale(2.2)', 'scale(1)'],
                opacity: [0.55, 0, 0.55],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 2.4, repeat: Infinity, ease: easeOut }
        }
      />
      <span className="relative size-2 rounded-full bg-[var(--hub-ok)]" />
    </span>
  )
}
