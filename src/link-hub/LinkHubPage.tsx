import { useCallback, useEffect, useState } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'motion/react'
import type { Variants } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import { copyUrlActionId, hubLinks, monoActionId } from '#/content/hub-config'
import type { ConfiguredLink, HubLink } from '#/content/hub-config'
import type { LinkCopy, Locale } from '#/content/locale'
import { portraitAscii, portraitAsciiColumns } from '#/link-hub/portrait-ascii'
import { tileArt } from '#/link-hub/tile-art'
import type { TileArt } from '#/link-hub/tile-art'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  hubUrl: string
}

const messageDurationMs = 2400

/** Critically damped default — Apple damping 1.0 / response ~0.4. */
const springDefault = { type: 'spring' as const, bounce: 0, duration: 0.4 }
const springSnappy = { type: 'spring' as const, bounce: 0, duration: 0.3 }

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: springDefault },
}

/* Press feedback on pointer-down (scale 0.97), hover lift is subtle — no bounce. */
const hoverLift = { y: -2, transition: springSnappy }
const tapPress = {
  scale: 0.97,
  transition: { duration: 0.1, ease: 'easeOut' as const },
}

function tileClass(highlighted?: boolean) {
  return [
    'group relative isolate flex min-h-24 flex-col rounded-2xl px-4 py-3.5 text-left',
    'material transition-[box-shadow] duration-300',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hub-accent)]',
    'hover:[box-shadow:var(--hub-shadow-lift)]',
    highlighted ? 'sm:col-span-2' : '',
  ].join(' ')
}

function isConfigured(link: HubLink): link is ConfiguredLink {
  return 'href' in link
}

function controlLabel({ label, title }: Pick<LinkCopy, 'label' | 'title'>) {
  return `${label}: ${title}`
}

/** A message that shows itself for a beat and then clears. */
function useTransientMessage(durationMs = messageDurationMs) {
  const [current, setCurrent] = useState<{ text: string } | null>(null)

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => setCurrent(null), durationMs)
    return () => clearTimeout(timer)
  }, [current, durationMs])

  const show = useCallback((text: string) => setCurrent({ text }), [])

  return [current?.text ?? null, show] as const
}

function TileSurface({
  art,
  wide,
}: {
  art: TileArt
  wide?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl"
    >
      <span
        className={`absolute -right-6 -bottom-8 size-24 opacity-[0.07] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.12] lg:size-28 ${
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
      className="shrink-0 text-[var(--hub-muted)] transition duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--hub-fg)]"
    >
      ↗
    </span>
  )
}

/** Sits beside the chip so the tile's top row reads as one label strip. */
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

type Tone = 'pending' | 'ok'

const toneClass: Record<Tone, string> = {
  pending:
    'bg-[color-mix(in_srgb,var(--hub-pending)_14%,white)] text-[#9a6700]',
  ok: 'bg-[color-mix(in_srgb,var(--hub-ok)_14%,white)] text-[#1b7a36]',
}

function StatusMessage({ children, tone }: { children: string; tone: Tone }) {
  return (
    <motion.span
      role="status"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={springSnappy}
      className={`absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.01em] ${toneClass[tone]}`}
    >
      {children}
    </motion.span>
  )
}

function LinkTile({
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
    <motion.a
      variants={itemVariants}
      whileHover={hoverLift}
      whileTap={tapPress}
      href={link.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      aria-label={controlLabel(copy)}
      data-highlighted={link.highlighted ? 'true' : undefined}
      className={tileClass(link.highlighted)}
      onClick={onActivate}
    >
      <TileSurface art={art} wide={link.highlighted} />
      <span className="flex items-center gap-3">
        <TileChip art={art} />
        <TileLabel label={copy.label} />
        <TileArrow />
      </span>
      <TileCaption title={copy.title} handle={copy.handle} />
    </motion.a>
  )
}

function ButtonTile({
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
    <motion.button
      variants={itemVariants}
      whileHover={hoverLift}
      whileTap={tapPress}
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
        {message ? <StatusMessage tone={tone}>{message}</StatusMessage> : null}
      </AnimatePresence>
    </motion.button>
  )
}

function AppleSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-[1.75rem] w-[3.1rem] shrink-0 rounded-full transition-[background-color] duration-300 ease-out"
      style={{
        backgroundColor: on ? 'var(--hub-ok)' : 'rgba(120, 120, 128, 0.32)',
      }}
    >
      <span
        className="absolute top-[0.125rem] size-[1.5rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22),0_1px_1px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out"
        style={{
          transform: on ? 'translateX(1.35rem)' : 'translateX(0.125rem)',
        }}
      />
    </span>
  )
}

function SwitchTile({
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
    <motion.button
      variants={itemVariants}
      whileHover={hoverLift}
      whileTap={tapPress}
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
    </motion.button>
  )
}

/* A monospace cell is ~0.6em wide, so the grid spans this many ems; sizing the
   font off the container width makes the art fill the frame at any breakpoint.
   The extra 0.4 is slack for mono faces whose advance runs a hair over 0.6em. */
const asciiWidthEm = portraitAsciiColumns * 0.6 + 0.4

function AsciiPortrait({ alt }: { alt: string }) {
  return (
    <span
      role="img"
      aria-label={alt}
      className="@container relative isolate block size-64 overflow-hidden rounded-[1.75rem] bg-[#e8e8ed] md:size-72 lg:size-[clamp(11rem,24vh,18rem)]"
    >
      <pre
        aria-hidden="true"
        className="m-0 bg-gradient-to-b from-[#1d1d1f] via-[#424245] to-[#86868b] bg-clip-text font-mono text-transparent"
        style={{
          fontSize: `calc(100cqw / ${asciiWidthEm})`,
          lineHeight: 1.14,
        }}
      >
        {portraitAscii}
      </pre>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_38%,transparent_42%,rgba(245,245,247,0.55)_100%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#f5f5f7] to-transparent"
      />
    </span>
  )
}

function AvailabilityPulse() {
  const reduceMotion = useReducedMotion()

  return (
    <span aria-hidden="true" className="relative flex size-2 shrink-0">
      {/* The ring is always in the tree — dropping it under reduced motion
          would make the client markup diverge from the server's. */}
      <motion.span
        className="absolute inset-0 rounded-full bg-[var(--hub-ok)]"
        initial={{ opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 0 }
            : { scale: [1, 2.2, 1], opacity: [0.55, 0, 0.55] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 2.4, repeat: Infinity, ease: 'easeOut' }
        }
      />
      <span className="relative size-2 rounded-full bg-[var(--hub-ok)]" />
    </span>
  )
}

/** Sits outside <main> so it reads as the page's contentinfo landmark. */
function HubFooter({ credit, rights }: Locale['footer']) {
  return (
    <motion.footer
      variants={itemVariants}
      className="relative z-10 mx-auto flex w-full max-w-6xl shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 pb-8 text-[0.75rem] tracking-[0.01em] text-[var(--hub-muted)] lg:px-10 lg:pb-6"
    >
      <span>{credit}</span>
      <span aria-hidden="true" className="opacity-40">
        ·
      </span>
      <span>{rights}</span>
    </motion.footer>
  )
}

export function LinkHubPage({ locale, analytics, hubUrl }: LinkHubPageProps) {
  const { identity } = locale
  const [photosMessage, showPhotosMessage] = useTransientMessage()
  const [copyFeedback, showCopyFeedback] = useTransientMessage()
  const [monochrome, setMonochrome] = useState(false)
  const copyAction = locale.actions[copyUrlActionId]
  const monoAction = locale.actions[monoActionId]
  const photosCopy = locale.links.photos

  useEffect(() => {
    analytics.track({ type: 'visit' })
  }, [analytics])

  async function copyHubUrl() {
    try {
      await navigator.clipboard.writeText(hubUrl)
    } catch {
      // A denied clipboard leaves the hub as it was: no feedback, no event.
      return
    }
    showCopyFeedback(copyAction.success)
    analytics.track({ type: 'action_click', actionId: copyUrlActionId })
  }

  function toggleMonochrome(next: boolean) {
    setMonochrome(next)
    analytics.track({ type: 'action_click', actionId: monoActionId })
  }

  return (
    <MotionConfig reducedMotion="user" transition={springDefault}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        data-mono={monochrome ? 'true' : undefined}
        className="relative flex min-h-dvh flex-col bg-[var(--hub-bg)] text-[var(--hub-fg)] lg:h-dvh"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {/* Soft atmospheric wash — depth without neon edge-bleed. */}
          <span className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-[#d2e3fc]/50 blur-[120px]" />
          <span className="absolute right-[-10%] bottom-[-8%] size-[28rem] rounded-full bg-[#e8e8ed]/80 blur-[100px]" />
        </span>

        {/* The tiles no longer stretch to the viewport, so on desktop the
              whole hub is centred rather than left hanging above dead space. */}
        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pt-12 pb-8 lg:min-h-0 lg:justify-center lg:gap-8 lg:px-10 lg:pt-10 lg:pb-6">
          <motion.section
            aria-label="Identity"
            variants={groupVariants}
            className="material-heavy relative isolate flex shrink-0 flex-col gap-8 rounded-[1.75rem] px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-12 md:px-10 md:py-8 lg:py-6"
          >
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 lg:gap-3">
              <motion.p
                variants={itemVariants}
                className="inline-flex max-w-full items-center rounded-full bg-[color-mix(in_srgb,var(--hub-accent)_10%,white)] px-3 py-1 text-[0.75rem] font-medium tracking-[0.01em] text-[var(--hub-accent)]"
              >
                {identity.role}
              </motion.p>
              <motion.h1
                variants={itemVariants}
                className="display-title text-4xl text-[var(--hub-fg)] md:text-5xl lg:text-6xl"
              >
                {identity.displayName}
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="max-w-prose text-lg leading-relaxed tracking-[0.01em] text-[var(--hub-muted)]"
              >
                {identity.bio}
              </motion.p>
              <motion.p
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--hub-ok)_12%,white)] px-3 py-1 text-[0.8125rem] font-medium tracking-[0.01em] text-[#1b7a36]"
              >
                <AvailabilityPulse />
                {identity.availability}
              </motion.p>
            </div>

            <motion.div
              variants={itemVariants}
              className="relative shrink-0 self-center"
            >
              <AsciiPortrait alt={identity.portraitAlt} />
            </motion.div>
          </motion.section>

          <motion.div
            variants={groupVariants}
            className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <section aria-label="Links" className="contents">
              {hubLinks.map((link) =>
                isConfigured(link) ? (
                  <LinkTile
                    key={link.id}
                    link={link}
                    copy={locale.links[link.id]}
                    onActivate={() =>
                      analytics.track({ type: 'link_click', linkId: link.id })
                    }
                  />
                ) : (
                  <ButtonTile
                    key={link.id}
                    art={tileArt.photos}
                    copy={{ label: photosCopy.label, title: photosCopy.title }}
                    message={photosMessage}
                    tone="pending"
                    onActivate={() => showPhotosMessage(photosCopy.comingSoon)}
                  />
                ),
              )}
            </section>

            <section aria-label="Actions" className="contents">
              <ButtonTile
                art={tileArt[copyUrlActionId]}
                copy={{ label: copyAction.label, title: copyAction.title }}
                message={copyFeedback}
                tone="ok"
                onActivate={() => {
                  void copyHubUrl()
                }}
              />
              <SwitchTile
                art={tileArt[monoActionId]}
                copy={{ label: monoAction.label, title: monoAction.title }}
                checked={monochrome}
                onCheckedChange={toggleMonochrome}
              />
            </section>
          </motion.div>
        </main>

        <HubFooter credit={locale.footer.credit} rights={locale.footer.rights} />
      </motion.div>
    </MotionConfig>
  )
}
