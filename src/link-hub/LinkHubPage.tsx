import { useCallback, useEffect, useState } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'
import type { MotionValue, Variants } from 'motion/react'
import type { PointerEvent } from 'react'

import type { AnalyticsPort } from '#/analytics/port'
import { copyUrlActionId, hubLinks } from '#/content/hub-config'
import type { ConfiguredLink, HubLink } from '#/content/hub-config'
import type { LinkCopy, Locale } from '#/content/locale'
import { tileArt } from '#/link-hub/tile-art'
import type { TileArt } from '#/link-hub/tile-art'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  portraitSrc: string
  hubUrl: string
}

const messageDurationMs = 2400

const pageVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const hoverLift = { y: -4, transition: { duration: 0.2 } }
const tapPress = { scale: 0.99, transition: { duration: 0.1 } }

function tileClass(highlighted?: boolean) {
  return [
    'group relative isolate flex min-h-28 flex-col overflow-hidden rounded-2xl border px-5 py-4 text-left',
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_24px_48px_-32px_rgba(0,0,0,1)]',
    'transition-colors duration-300',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
    highlighted
      ? 'border-amber-400/30 bg-amber-400/[0.06] hover:border-amber-300/50 sm:col-span-2'
      : 'border-white/10 bg-white/[0.03] hover:border-white/20',
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

/** Highlight that tracks the pointer across a single tile. */
function useSpotlight() {
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const background = useMotionTemplate`radial-gradient(280px circle at ${x}px ${y}px, rgba(255,255,255,0.10), transparent 70%)`

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      x.set(event.clientX - bounds.left)
      y.set(event.clientY - bounds.top)
    },
    [x, y],
  )

  return { background, onPointerMove }
}

function TileSurface({
  art,
  wide,
  spotlight,
}: {
  art: TileArt
  wide?: boolean
  spotlight: MotionValue<string>
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl"
    >
      <span
        className="absolute -right-14 -bottom-16 size-48 rounded-full opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: art.glow }}
      />
      <span
        className={`absolute -right-8 -bottom-10 size-32 text-neutral-50 opacity-[0.06] transition duration-500 group-hover:scale-110 group-hover:opacity-[0.11] lg:size-40 ${
          wide ? 'lg:size-56' : ''
        }`}
      >
        {art.glyph}
      </span>
      <motion.span
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </span>
  )
}

function TileChip({ art }: { art: TileArt }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] p-2 transition duration-300 group-hover:border-white/20 group-hover:bg-white/10"
      style={{ color: art.accent }}
    >
      {art.glyph}
    </span>
  )
}

function TileArrow() {
  return (
    <span
      aria-hidden="true"
      className="text-neutral-600 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-200"
    >
      ↗
    </span>
  )
}

function TileCaption({ label, title, handle }: LinkCopy) {
  return (
    <span className="mt-auto block pt-8">
      <span className="block text-[0.7rem] tracking-[0.18em] text-neutral-500 uppercase">
        {label}
      </span>
      <span className="mt-1 block text-lg font-medium text-neutral-50">
        {title}
      </span>
      {handle ? (
        <span className="mt-0.5 block font-mono text-xs text-neutral-400">
          {handle}
        </span>
      ) : null}
    </span>
  )
}

function StatusMessage({
  children,
  tone,
}: {
  children: string
  tone: 'amber' | 'emerald'
}) {
  return (
    <motion.span
      role="status"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className={
        tone === 'amber'
          ? 'absolute top-4 right-5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200'
          : 'absolute top-4 right-5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200'
      }
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
  const spotlight = useSpotlight()
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
      onPointerMove={spotlight.onPointerMove}
      onClick={onActivate}
    >
      <TileSurface
        art={art}
        wide={link.highlighted}
        spotlight={spotlight.background}
      />
      <span className="flex items-start justify-between gap-3">
        <TileChip art={art} />
        <TileArrow />
      </span>
      <TileCaption {...copy} />
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
  tone: 'amber' | 'emerald'
  onActivate: () => void
}) {
  const spotlight = useSpotlight()

  return (
    <motion.button
      variants={itemVariants}
      whileHover={hoverLift}
      whileTap={tapPress}
      type="button"
      aria-label={controlLabel(copy)}
      className={tileClass()}
      onPointerMove={spotlight.onPointerMove}
      onClick={onActivate}
    >
      <TileSurface art={art} spotlight={spotlight.background} />
      <span className="flex items-start justify-between gap-3">
        <TileChip art={art} />
      </span>
      <TileCaption {...copy} />
      <AnimatePresence>
        {message ? <StatusMessage tone={tone}>{message}</StatusMessage> : null}
      </AnimatePresence>
    </motion.button>
  )
}

function AvailabilityPulse() {
  const reduceMotion = useReducedMotion()

  return (
    <span aria-hidden="true" className="relative flex size-2 shrink-0">
      {/* The ring is always in the tree — dropping it under reduced motion
          would make the client markup diverge from the server's. */}
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-400"
        initial={{ opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 0 }
            : { scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 2.2, repeat: Infinity, ease: 'easeOut' }
        }
      />
      <span className="relative size-2 rounded-full bg-emerald-400" />
    </span>
  )
}

export function LinkHubPage({
  locale,
  analytics,
  portraitSrc,
  hubUrl,
}: LinkHubPageProps) {
  const { identity } = locale
  const [photosMessage, showPhotosMessage] = useTransientMessage()
  const [copyFeedback, showCopyFeedback] = useTransientMessage()
  const copyAction = locale.actions[copyUrlActionId]
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

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.main
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        className="relative flex min-h-dvh flex-col bg-neutral-950 text-neutral-50 lg:h-dvh"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="absolute -top-40 -left-24 size-[34rem] rounded-full bg-amber-500/[0.07] blur-[140px]" />
          <span className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-indigo-500/[0.08] blur-[140px]" />
          <span className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
        </span>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 lg:min-h-0 lg:gap-8 lg:px-10 lg:py-10">
          <motion.section
            aria-label="Identity"
            variants={groupVariants}
            className="flex shrink-0 flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12"
          >
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 lg:gap-3">
              <motion.p
                variants={itemVariants}
                className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium tracking-[0.18em] text-amber-300 uppercase"
              >
                {identity.role}
              </motion.p>
              <motion.h1
                variants={itemVariants}
                className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent md:text-5xl lg:text-6xl"
              >
                {identity.displayName}
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="max-w-prose text-lg text-neutral-400"
              >
                {identity.bio}
              </motion.p>
              <motion.p
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300"
              >
                <AvailabilityPulse />
                {identity.availability}
              </motion.p>
            </div>

            <motion.div
              variants={itemVariants}
              className="relative shrink-0 self-center"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 rounded-full bg-amber-500/10 blur-3xl"
              />
              <img
                src={portraitSrc}
                alt={identity.portraitAlt}
                width={320}
                height={320}
                className="relative size-64 rounded-2xl object-cover shadow-[0_40px_80px_-40px_rgba(0,0,0,1)] ring-1 ring-white/10 md:size-72 lg:size-[clamp(11rem,26vh,20rem)]"
              />
            </motion.div>
          </motion.section>

          <motion.div
            variants={groupVariants}
            className="grid flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-0 lg:grid-cols-4"
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
                    tone="amber"
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
                tone="emerald"
                onActivate={() => {
                  void copyHubUrl()
                }}
              />
            </section>
          </motion.div>
        </div>
      </motion.main>
    </MotionConfig>
  )
}
