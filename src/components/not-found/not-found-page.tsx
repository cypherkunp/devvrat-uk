import { useNavigate } from '@tanstack/react-router'

import {
  Grid,
  GridCell,
  GridCrosses,
  GridPage,
  GridSystem,
} from '#/components/geist/components'
import { HubFooter } from '#/components/link-hub/hub-footer'
import { tileClass } from '#/components/link-hub/tiles'
import {
  notFoundRedirectSeconds,
  useCountdown,
} from '#/components/not-found/hooks'
import { loadLocale } from '#/content/locale'
import type { Locale } from '#/content/locale'

const emptyCells = 13

export function NotFoundPage({
  locale,
  onRedirect,
}: {
  locale: Locale
  onRedirect: () => void
}) {
  const remaining = useCountdown(notFoundRedirectSeconds, onRedirect)
  const redirect = locale.notFound.redirect.replace(
    '{seconds}',
    String(remaining),
  )

  return (
    <div className="hub-stage min-h-dvh bg-[var(--hub-bg)] text-[var(--hub-fg)]">
      <GridPage>
        <GridSystem guideWidth={1} unstable_useContainer>
          <Grid
            className="hub-grid"
            columns={{ sm: 1, md: 2, lg: 4 }}
            rows={{ sm: 3, md: 8, lg: 4 }}
          >
            <GridCrosses />

            <main className="contents">
              <GridCell>
                <div className={tileClass(true, 'center')}>
                  <h1 className="display-title min-w-0 text-7xl leading-none text-[var(--hub-fg)] md:text-8xl lg:text-9xl">
                    {locale.notFound.code}
                  </h1>
                </div>
              </GridCell>
              <GridCell>
                <div className={tileClass(true, 'left')}>
                  <p className="text-copy-16 min-w-0 wrap-break-word text-[var(--hub-fg)]">
                    {locale.notFound.heading}
                  </p>
                  <p
                    className="text-copy-16 mt-2 min-w-0 wrap-break-word text-[var(--hub-muted)]"
                    aria-live="polite"
                  >
                    {redirect}
                  </p>
                </div>
              </GridCell>
            </main>

            {Array.from({ length: emptyCells }, (_, index) => (
              <GridCell key={index} className="max-md:hidden">
                <div className="h-full min-h-16" aria-hidden="true" />
              </GridCell>
            ))}

            <GridCell>
              <HubFooter
                credit={locale.footer.credit}
                rights={locale.footer.rights}
              />
            </GridCell>
          </Grid>
        </GridSystem>
      </GridPage>
    </div>
  )
}

export function NotFoundRoute() {
  const navigate = useNavigate()
  const locale = loadLocale('en')

  return (
    <NotFoundPage
      locale={locale}
      onRedirect={() => {
        void navigate({ to: '/' })
      }}
    />
  )
}
