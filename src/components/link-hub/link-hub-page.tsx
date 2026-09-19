import { useEffect, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import {
  copyUrlActionId,
  darkActionId,
  hubLinks,
  monoActionId,
  resumeHref,
} from '#/content/hub-config'
import type { Locale } from '#/content/locale'
import {
  Grid,
  GridCell,
  GridCrosses,
  GridPage,
  GridSystem,
} from '#/components/geist/components'
import { AsciiPortrait } from '#/components/link-hub/ascii-portrait'
import { HubFooter } from '#/components/link-hub/hub-footer'
import { useOsDark, useTransientMessage } from '#/components/link-hub/hooks'
import { easeOut, springDefault } from '#/components/link-hub/motion'
import { tileArt } from '#/components/link-hub/tile-art'
import {
  ButtonTile,
  LinkTile,
  StaticTile,
  SwitchTile,
} from '#/components/link-hub/tiles'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  hubUrl: string
}

export function LinkHubPage({ locale, analytics, hubUrl }: LinkHubPageProps) {
  const { identity } = locale
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
        initial={false}
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
                  {hubLinks.map((link) => (
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
                  ))}
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
