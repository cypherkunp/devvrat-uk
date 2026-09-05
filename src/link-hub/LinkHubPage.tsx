import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MotionConfig, motion } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import {
  copyUrlActionId,
  darkActionId,
  hubLinks,
  monoActionId,
  resumeHref,
} from '#/content/hub-config'
import type { ConfiguredLink, HubLink } from '#/content/hub-config'
import type { Locale } from '#/content/locale'
import {
  Grid,
  GridCell,
  GridCrosses,
  GridPage,
  GridSystem,
} from '#/geist/components'
import { portraitAscii, portraitAsciiColumns } from '#/link-hub/portrait-ascii'
import { easeOut, springDefault } from '#/link-hub/motion'
import { tileArt } from '#/link-hub/tile-art'
import { ButtonTile, LinkTile, StaticTile, SwitchTile } from '#/link-hub/tiles'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  hubUrl: string
}

const messageDurationMs = 2400

function subscribeOsDark(onStoreChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onStoreChange)
  return () => mq.removeEventListener('change', onStoreChange)
}

function getOsDark() {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Server snapshot is light — CSS media query still paints OS dark on first frame. */
function useOsDark() {
  return useSyncExternalStore(subscribeOsDark, getOsDark, () => false)
}

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
      className="@container relative isolate flex size-full min-h-64 items-center justify-center overflow-hidden md:min-h-0"
    >
      <pre
        aria-hidden="true"
        className="m-0 bg-gradient-to-b from-[var(--hub-fg)] via-[#424245] to-[var(--hub-muted)] bg-clip-text font-mono text-transparent"
        style={{
          fontSize: `calc(100cqw / ${asciiWidthEm})`,
          lineHeight: 1.14,
        }}
      >
        {portraitAscii}
      </pre>
    </span>
  )
}

function HubFooter({ credit, rights }: Locale['footer']) {
  return (
    <footer className="tile tile-static flex h-full min-h-16 w-full items-center px-4 py-3 text-left text-[var(--hub-muted)] md:text-center">
      <p className="text-label-12-mono w-full">
        {credit}. {rights}
      </p>
    </footer>
  )
}

export function LinkHubPage({ locale, analytics, hubUrl }: LinkHubPageProps) {
  const { identity } = locale
  const [photosMessage, showPhotosMessage] = useTransientMessage()
  const [copyFeedback, showCopyFeedback] = useTransientMessage()
  const [monochrome, setMonochrome] = useState(false)
  const [schemeOverride, setSchemeOverride] = useState<'light' | 'dark' | null>(
    null,
  )
  const osDark = useOsDark()
  const dark = schemeOverride === 'dark' || (schemeOverride === null && osDark)
  const copyAction = locale.actions[copyUrlActionId]
  const monoAction = locale.actions[monoActionId]
  const darkAction = locale.actions[darkActionId]
  const photosCopy = locale.links.photos

  useEffect(() => {
    analytics.track({ type: 'visit' })
  }, [analytics])

  async function copyHubUrl() {
    try {
      await navigator.clipboard.writeText(hubUrl)
    } catch {
      return
    }
    showCopyFeedback(copyAction.success)
    analytics.track({ type: 'action_click', actionId: copyUrlActionId })
  }

  function toggleMonochrome(next: boolean) {
    setMonochrome(next)
    analytics.track({ type: 'action_click', actionId: monoActionId })
  }

  function toggleDark(next: boolean) {
    setSchemeOverride(next ? 'dark' : 'light')
    analytics.track({ type: 'action_click', actionId: darkActionId })
  }

  return (
    <MotionConfig reducedMotion="user" transition={springDefault}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: easeOut }}
        data-mono={monochrome ? 'true' : undefined}
        data-scheme={schemeOverride ?? undefined}
        className="hub-stage min-h-dvh bg-[var(--hub-bg)] text-[var(--hub-fg)]"
      >
        <GridPage>
          <GridSystem guideWidth={1} unstable_useContainer>
            <Grid
              className="hub-grid"
              columns={{ sm: 1, md: 2, lg: 4 }}
              rows={{ sm: 16, md: 8, lg: 4 }}
            >
              <GridCrosses />

              <main className="contents">
                <section aria-label="Identity" className="contents">
                  <GridCell>
                    <StaticTile
                      titleAs="h1"
                      copy={{
                        label: identity.role,
                        title: identity.displayName,
                      }}
                    />
                  </GridCell>
                  <GridCell>
                    <StaticTile
                      showLabel={false}
                      align="left"
                      copy={{
                        label: identity.bioLabel,
                        title: identity.bio,
                      }}
                    />
                  </GridCell>
                  <GridCell>
                    <AsciiPortrait alt={identity.portraitAlt} />
                  </GridCell>
                  <GridCell>
                    <LinkTile
                      link={{ id: 'resume', href: resumeHref }}
                      copy={{
                        ...locale.links.resume,
                        title: identity.availability,
                      }}
                      onActivate={() =>
                        analytics.track({
                          type: 'link_click',
                          linkId: 'resume',
                        })
                      }
                    />
                  </GridCell>
                </section>

                <section aria-label="Links" className="contents">
                  {hubLinks.map((link) =>
                    isConfigured(link) ? (
                      <GridCell key={link.id}>
                        <LinkTile
                          link={link}
                          copy={locale.links[link.id]}
                          onActivate={() =>
                            analytics.track({
                              type: 'link_click',
                              linkId: link.id,
                            })
                          }
                        />
                      </GridCell>
                    ) : (
                      <GridCell key={link.id}>
                        <ButtonTile
                          art={tileArt.photos}
                          copy={{
                            label: photosCopy.label,
                            title: photosCopy.title,
                          }}
                          message={photosMessage}
                          tone="pending"
                          onActivate={() =>
                            showPhotosMessage(photosCopy.comingSoon)
                          }
                        />
                      </GridCell>
                    ),
                  )}
                </section>

                <section aria-label="Actions" className="contents">
                  <GridCell>
                    <ButtonTile
                      art={tileArt[copyUrlActionId]}
                      copy={{
                        label: copyAction.label,
                        title: copyAction.title,
                      }}
                      message={copyFeedback}
                      tone="ok"
                      onActivate={() => {
                        void copyHubUrl()
                      }}
                    />
                  </GridCell>
                  <GridCell>
                    <SwitchTile
                      art={tileArt[monoActionId]}
                      copy={{
                        label: monoAction.label,
                        title: monoAction.title,
                      }}
                      checked={monochrome}
                      onCheckedChange={toggleMonochrome}
                    />
                  </GridCell>
                  <GridCell>
                    <SwitchTile
                      art={tileArt[darkActionId]}
                      copy={{
                        label: darkAction.label,
                        title: darkAction.title,
                      }}
                      checked={dark}
                      onCheckedChange={toggleDark}
                    />
                  </GridCell>
                </section>
              </main>

              <GridCell>
                <div className="h-full min-h-16" aria-hidden="true" />
              </GridCell>
              <GridCell>
                <HubFooter
                  credit={locale.footer.credit}
                  rights={locale.footer.rights}
                />
              </GridCell>
            </Grid>
          </GridSystem>
        </GridPage>
      </motion.div>
    </MotionConfig>
  )
}
