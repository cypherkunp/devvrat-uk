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

/** Chamfered panel outline: top-right and bottom-left corners sliced off. */
function cut(size: number) {
  return `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, ${size}px 100%, 0 calc(100% - ${size}px))`
}

const tileCut = cut(16)
const chipCut = cut(6)
const frameCut = cut(22)

const scanlines =
  '[background-image:repeating-linear-gradient(to_bottom,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_3px)]'

function tileClass(highlighted?: boolean) {
  return [
    // The chamfer lives on the surface behind the control, so the focus ring
    // stays a full un-clipped rectangle.
    'group relative isolate flex min-h-28 flex-col px-5 py-4 text-left',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
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

/** Highlight that tracks the pointer across a single tile. */
function useSpotlight() {
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const background = useMotionTemplate`radial-gradient(280px circle at ${x}px ${y}px, rgba(103,232,249,0.16), transparent 70%)`

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
      className="pointer-events-none absolute inset-0 -z-10"
    >
      {/* Edge and fill are two chamfered layers a pixel apart, which is what
          draws the neon outline along the sliced corners. */}
      <span
        className="absolute inset-0 opacity-55 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          clipPath: tileCut,
          background: `linear-gradient(135deg, ${art.accent} 0%, ${art.accent}44 35%, rgba(148,163,184,0.14) 62%, ${art.accent}cc 100%)`,
        }}
      />
      <span
        className="absolute inset-px overflow-hidden bg-[#070a14]"
        style={{ clipPath: tileCut }}
      >
        <span
          className="absolute -right-16 -bottom-20 size-52 rounded-full opacity-70 blur-[64px] transition-opacity duration-500 group-hover:opacity-100"
          style={{ backgroundColor: art.glow }}
        />
        <span
          className={`absolute -right-8 -bottom-10 size-32 opacity-[0.09] transition duration-500 group-hover:scale-110 group-hover:opacity-25 lg:size-40 ${
            wide ? 'lg:size-56' : ''
          }`}
          style={{ color: art.accent }}
        >
          {art.glyph}
        </span>
        <motion.span
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlight }}
        />
        <span className={`absolute inset-0 opacity-60 ${scanlines}`} />
        <span
          className="absolute inset-x-0 top-0 h-px opacity-80"
          style={{
            background: `linear-gradient(90deg, transparent, ${art.accent}, transparent)`,
          }}
        />
      </span>
    </span>
  )
}

function TileChip({ art }: { art: TileArt }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 items-center justify-center border p-2 transition duration-300"
      style={{
        clipPath: chipCut,
        color: art.accent,
        borderColor: `${art.accent}59`,
        backgroundColor: `${art.accent}14`,
        boxShadow: `0 0 22px -8px ${art.accent}`,
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
      className="font-mono text-slate-600 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300"
    >
      ↗
    </span>
  )
}

function TileCaption({ label, title, handle }: LinkCopy) {
  return (
    <span className="mt-auto block pt-8">
      <span className="hud-tag block font-mono text-[0.65rem] tracking-[0.3em] text-cyan-300/70 uppercase">
        {label}
      </span>
      <span className="mt-1 block text-lg font-medium tracking-tight text-slate-50">
        {title}
      </span>
      {handle ? (
        <span className="mt-0.5 block font-mono text-xs text-slate-500">
          {handle}
        </span>
      ) : null}
    </span>
  )
}

type Tone = 'pending' | 'ok'

const toneClass: Record<Tone, string> = {
  pending:
    'border-[#fcee0a]/40 bg-[#fcee0a]/10 text-[#fcee0a] [text-shadow:0_0_12px_rgba(252,238,10,0.5)]',
  ok: 'border-lime-400/40 bg-lime-400/10 text-lime-300 [text-shadow:0_0_12px_rgba(163,230,53,0.5)]',
}

function StatusMessage({ children, tone }: { children: string; tone: Tone }) {
  return (
    <motion.span
      role="status"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      style={{ clipPath: chipCut }}
      className={`hud-brackets absolute top-4 right-5 border px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.16em] uppercase ${toneClass[tone]}`}
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
  tone: Tone
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
        className="absolute inset-0 rounded-full bg-lime-400"
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
      <span className="relative size-2 rounded-full bg-lime-400 shadow-[0_0_10px_2px_rgba(163,230,53,0.7)]" />
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
        className="relative flex min-h-dvh flex-col bg-[#04060d] text-slate-50 lg:h-dvh"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="absolute -top-44 -left-32 size-[38rem] rounded-full bg-fuchsia-600/20 blur-[150px]" />
          <span className="absolute top-1/4 -right-44 size-[34rem] rounded-full bg-cyan-500/20 blur-[150px]" />
          <span className="absolute -bottom-72 left-1/3 size-[32rem] rounded-full bg-violet-600/15 blur-[160px]" />
          <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(34,211,238,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
          <span className={`absolute inset-0 opacity-50 ${scanlines}`} />
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
                style={{ clipPath: chipCut }}
                className="hud-tag inline-flex items-center border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 font-mono text-[0.65rem] font-medium tracking-[0.3em] text-cyan-200 uppercase [text-shadow:0_0_14px_rgba(34,211,238,0.55)]"
              >
                {identity.role}
              </motion.p>
              <motion.h1
                variants={itemVariants}
                data-text={identity.displayName}
                className="glitch neon-title text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl lg:text-6xl"
              >
                {identity.displayName}
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="max-w-prose text-lg text-slate-400"
              >
                {identity.bio}
              </motion.p>
              <motion.p
                variants={itemVariants}
                style={{ clipPath: chipCut }}
                className="inline-flex items-center gap-2 border border-lime-400/35 bg-lime-400/10 px-3 py-1 font-mono text-xs font-medium tracking-[0.16em] text-lime-300 uppercase [text-shadow:0_0_12px_rgba(163,230,53,0.5)]"
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
                className="pointer-events-none absolute -inset-10 bg-fuchsia-600/15 blur-[90px]"
              />
              {/* Every decoration stays inside the frame box so the portrait
                  keeps the same right edge as the grid below it. */}
              <span
                className="relative block p-px"
                style={{
                  clipPath: frameCut,
                  background:
                    'linear-gradient(135deg, #22d3ee 0%, #7c3aed 55%, #ff2fd0 100%)',
                }}
              >
                <span
                  className="relative isolate block overflow-hidden bg-[#04060d]"
                  style={{ clipPath: frameCut }}
                >
                  <img
                    src={portraitSrc}
                    alt={identity.portraitAlt}
                    width={320}
                    height={320}
                    className="block size-64 object-cover contrast-[1.05] saturate-[0.9] md:size-72 lg:size-[clamp(11rem,24vh,18rem)]"
                  />
                  {/* The neon grade is masked out of the middle so it colours
                      the backdrop and rim without washing out the face. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 mix-blend-multiply [mask-image:radial-gradient(circle_at_50%_40%,transparent_22%,black_62%)]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#062c3d] via-[#160446] to-[#31043a] opacity-80 mix-blend-screen [mask-image:radial-gradient(circle_at_50%_40%,transparent_26%,black_70%)]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_38%,transparent_46%,rgba(4,6,13,0.7)_100%)]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#04060d]/90 to-transparent"
                  />
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 opacity-50 ${scanlines}`}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2.5 left-2.5 size-5 border-t border-l border-cyan-300/70"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2.5 bottom-2.5 size-5 border-r border-b border-fuchsia-400/70"
                  />
                </span>
              </span>
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
            </section>
          </motion.div>
        </div>
      </motion.main>
    </MotionConfig>
  )
}
