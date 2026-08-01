import { useCallback, useEffect, useState } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'motion/react'
import type { Variants } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import { copyUrlActionId, hubLinks } from '#/content/hub-config'
import type { HubLink } from '#/content/hub-config'
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

const tileClass = [
  'group relative isolate flex min-h-24 flex-col overflow-hidden',
  'border px-4 py-3 text-left transition-colors duration-200',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
].join(' ')

const tileToneClass = {
  default:
    'border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900',
  highlighted:
    'border-amber-400/80 bg-amber-400/10 hover:border-amber-300 hover:bg-amber-400/15',
}

function isConfigured(
  link: HubLink,
): link is Extract<HubLink, { href: string }> {
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

function TileCaption({ label, title, handle }: LinkCopy) {
  return (
    <>
      <span className="block text-xs tracking-[0.15em] text-neutral-400 uppercase">
        {label}
      </span>
      <span className="mt-auto block pt-6 text-lg font-medium">{title}</span>
      {handle ? (
        <span className="block text-sm text-neutral-400">{handle}</span>
      ) : null}
    </>
  )
}

function TileBackdrop({ art, wide }: { art: TileArt; wide?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      <span
        className="absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundImage: art.tint }}
      />
      <span
        className={`absolute top-1/2 -right-6 size-24 -translate-y-1/2 text-neutral-100 opacity-[0.07] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.15] lg:size-32 ${
          wide ? 'lg:size-44' : ''
        }`}
      >
        {art.glyph}
      </span>
    </span>
  )
}

function TileArrow() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-3 right-4 text-neutral-600 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-300"
    >
      ↗
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
          ? 'absolute top-3 right-4 text-sm text-amber-300'
          : 'absolute top-3 right-4 text-sm text-emerald-400'
      }
    >
      {children}
    </motion.span>
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
        className="flex min-h-dvh flex-col bg-neutral-950 text-neutral-50 lg:h-dvh"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 lg:min-h-0 lg:gap-8 lg:px-10 lg:py-10">
          <motion.section
            aria-label="Identity"
            variants={groupVariants}
            className="flex shrink-0 flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-3">
              <motion.p
                variants={itemVariants}
                className="text-sm font-medium tracking-[0.2em] text-amber-400 uppercase"
              >
                {identity.role}
              </motion.p>
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
              >
                {identity.displayName}
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="max-w-prose text-lg text-neutral-300"
              >
                {identity.bio}
              </motion.p>
              <motion.p
                variants={itemVariants}
                className="flex items-center gap-2 text-sm font-medium text-emerald-400"
              >
                <AvailabilityPulse />
                {identity.availability}
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="shrink-0">
              <img
                src={portraitSrc}
                alt={identity.portraitAlt}
                width={320}
                height={320}
                className="size-64 rounded-sm object-cover md:size-72 lg:size-[clamp(11rem,26vh,20rem)]"
              />
            </motion.div>
          </motion.section>

          <motion.div
            variants={groupVariants}
            className="grid flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-0 lg:grid-cols-4"
          >
            <section aria-label="Links" className="contents">
              {hubLinks.map((link) => {
                if (isConfigured(link)) {
                  const copy = locale.links[link.id]
                  const external = link.href.startsWith('http')

                  return (
                    <motion.a
                      key={link.id}
                      variants={itemVariants}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
                      href={link.href}
                      {...(external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      aria-label={controlLabel(copy)}
                      data-highlighted={link.highlighted ? 'true' : undefined}
                      className={`${tileClass} ${
                        link.highlighted
                          ? `${tileToneClass.highlighted} sm:col-span-2`
                          : tileToneClass.default
                      }`}
                      onClick={() => {
                        analytics.track({ type: 'link_click', linkId: link.id })
                      }}
                    >
                      <TileBackdrop
                        art={tileArt[link.id]}
                        wide={link.highlighted}
                      />
                      <TileCaption {...copy} />
                      <TileArrow />
                    </motion.a>
                  )
                }

                const copy = locale.links.photos
                return (
                  <motion.button
                    key={link.id}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
                    type="button"
                    aria-label={controlLabel(copy)}
                    className={`${tileClass} ${tileToneClass.default}`}
                    onClick={() => showPhotosMessage(copy.comingSoon)}
                  >
                    <TileBackdrop art={tileArt.photos} />
                    <TileCaption label={copy.label} title={copy.title} />
                    <AnimatePresence>
                      {photosMessage ? (
                        <StatusMessage tone="amber">
                          {photosMessage}
                        </StatusMessage>
                      ) : null}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </section>

            <section aria-label="Actions" className="contents">
              <motion.button
                variants={itemVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
                type="button"
                aria-label={controlLabel(copyAction)}
                className={`${tileClass} ${tileToneClass.default}`}
                onClick={() => {
                  void copyHubUrl()
                }}
              >
                <TileBackdrop art={tileArt[copyUrlActionId]} />
                <TileCaption
                  label={copyAction.label}
                  title={copyAction.title}
                />
                <AnimatePresence>
                  {copyFeedback ? (
                    <StatusMessage tone="emerald">{copyFeedback}</StatusMessage>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            </section>
          </motion.div>
        </div>
      </motion.main>
    </MotionConfig>
  )
}
