import { useEffect, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import {
  copyUrlActionId,
  darkActionId,
  hubLinks,
  monoActionId,
} from '#/content/hub-config'
import type { Locale } from '#/content/locale'
import {
  Avatar,
  Grid,
  GridCell,
  GridCrosses,
  GridPage,
  GridSystem,
} from '#/components/geist/components'
import { HubFooter } from '#/components/link-hub/hub-footer'
import { useOsDark, useTransientMessage } from '#/components/link-hub/hooks'
import { easeOut, springDefault } from '#/components/link-hub/motion'
import { tileArt } from '#/components/link-hub/tile-art'
import {
  ActionButton,
  ActionSwitch,
  IdentityTile,
  LinkTile,
} from '#/components/link-hub/tiles'
import type { ActionMessage } from '#/components/link-hub/tiles'

/** Two columns wide from md up; one column on phones. */
const span2 = { md: 'span 2', lg: 'span 2' }
/** Identity is pinned to the top-left 2×2 on desktop. */
const identityColumn = { md: 'span 2', lg: '1 / span 2' }
const identityRow = { lg: '1 / span 2' }

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  hubUrl: string
}

export function LinkHubPage({ locale, analytics, hubUrl }: LinkHubPageProps) {
  const { identity } = locale
  const [copyFeedback, showCopyFeedback] = useTransientMessage<ActionMessage>()
  const [monochrome, setMonochrome] = useState(false)
  const [schemeOverride, setSchemeOverride] = useState<'light' | 'dark' | null>(
    null,
  )
  const osDark = useOsDark()
  const dark = schemeOverride === 'dark' || (schemeOverride === null && osDark)
  const copyAction = locale.actions[copyUrlActionId]
  const monoAction = locale.actions[monoActionId]
  const darkAction = locale.actions[darkActionId]

  useEffect(() => {
    analytics.track({ type: 'visit' })
  }, [analytics])

  async function copyHubUrl() {
    try {
      await navigator.clipboard.writeText(hubUrl)
    } catch {
      // Blocked or missing clipboard: say so, and hand over the URL to copy by hand.
      showCopyFeedback({
        text: copyAction.failure.replace('{url}', new URL(hubUrl).host),
        tone: 'error',
      })
      return
    }
    showCopyFeedback({ text: copyAction.success, tone: 'ok' })
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
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: easeOut }}
        data-mono={monochrome ? 'true' : undefined}
        data-scheme={schemeOverride ?? undefined}
        className="hub-stage min-h-dvh bg-[var(--hub-bg)] text-[var(--hub-fg)]"
      >
        <GridPage>
          <GridSystem guideWidth={1} unstable_useContainer>
            {/*
              lg: Identity 2×2 | 8 Links (Portfolio first), then a slim band of
              Actions beside the footer. md/sm reflow in the same order.
            */}
            <Grid
              className="hub-grid"
              columns={{ sm: 1, md: 2, lg: 4 }}
              rows={{ sm: 11, md: 7, lg: 4 }}
            >
              <GridCrosses />

              <main className="contents">
                <GridCell column={identityColumn} row={identityRow} solid>
                  <section aria-label="Identity" className="h-full">
                    <IdentityTile
                      name={identity.displayName}
                      role={identity.role}
                      bio={identity.bio}
                      portrait={
                        <Avatar
                          size={80}
                          src="/portrait.jpg"
                          title={identity.portraitAlt}
                        />
                      }
                    />
                  </section>
                </GridCell>

                <section aria-label="Links" className="contents">
                  {hubLinks.map((link) => (
                    <GridCell key={link.id} solid={link.highlighted}>
                      <LinkTile
                        link={link}
                        copy={
                          link.id === 'resume'
                            ? {
                                ...locale.links.resume,
                                title: identity.availability,
                              }
                            : locale.links[link.id]
                        }
                        onActivate={() =>
                          analytics.track({
                            type: 'link_click',
                            linkId: link.id,
                          })
                        }
                      />
                    </GridCell>
                  ))}
                </section>

                <GridCell column={span2} solid>
                  <section aria-label="Actions" className="hub-actions">
                    <ActionButton
                      art={tileArt[copyUrlActionId]}
                      copy={{
                        label: copyAction.label,
                        title: copyAction.title,
                      }}
                      message={copyFeedback}
                      onActivate={() => {
                        void copyHubUrl()
                      }}
                    />
                    <ActionSwitch
                      art={tileArt[monoActionId]}
                      copy={{
                        label: monoAction.label,
                        title: monoAction.title,
                      }}
                      checked={monochrome}
                      onCheckedChange={toggleMonochrome}
                    />
                    <ActionSwitch
                      art={tileArt[darkActionId]}
                      copy={{
                        label: darkAction.label,
                        title: darkAction.title,
                      }}
                      checked={dark}
                      onCheckedChange={toggleDark}
                    />
                  </section>
                </GridCell>
              </main>

              <GridCell column={span2} solid>
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
