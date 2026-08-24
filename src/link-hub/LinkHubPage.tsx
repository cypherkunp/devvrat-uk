import { useCallback, useEffect, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import { copyUrlActionId, hubLinks, monoActionId } from '#/content/hub-config'
import type { ConfiguredLink, HubLink } from '#/content/hub-config'
import type { Locale } from '#/content/locale'
import { portraitAscii, portraitAsciiColumns } from '#/link-hub/portrait-ascii'
import {
  groupVariants,
  itemVariants,
  mainVariants,
  pageVariants,
  panelVariants,
  springDefault,
} from '#/link-hub/motion'
import { tileArt } from '#/link-hub/tile-art'
import {
  AvailabilityPulse,
  ButtonTile,
  LinkTile,
  SwitchTile,
} from '#/link-hub/tiles'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  hubUrl: string
}

const messageDurationMs = 2400

function isConfigured(link: HubLink): link is ConfiguredLink {
  return 'href' in link
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
        className="hub-stage relative flex min-h-dvh flex-col bg-[var(--hub-bg)] text-[var(--hub-fg)] lg:h-dvh"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-[#d2e3fc]/50 blur-[120px]" />
          <span className="absolute right-[-10%] bottom-[-8%] size-[28rem] rounded-full bg-[#e8e8ed]/80 blur-[100px]" />
        </span>

        <motion.main
          variants={mainVariants}
          className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pt-12 pb-8 lg:min-h-0 lg:justify-center lg:gap-8 lg:px-10 lg:pt-10 lg:pb-6"
        >
          <motion.section
            aria-label="Identity"
            variants={panelVariants}
            className="material-heavy relative isolate flex shrink-0 flex-col gap-8 rounded-[1.75rem] px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-12 md:px-10 md:py-8 lg:py-6"
          >
            <motion.div
              variants={groupVariants}
              className="flex min-w-0 flex-1 flex-col items-start gap-4 lg:gap-3"
            >
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
            </motion.div>

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
        </motion.main>

        <HubFooter credit={locale.footer.credit} rights={locale.footer.rights} />
      </motion.div>
    </MotionConfig>
  )
}
