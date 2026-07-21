import { motion } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import type { Locale } from '#/content/locale'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  portraitSrc: string
}

export function LinkHubPage({ locale, analytics: _analytics, portraitSrc }: LinkHubPageProps) {
  const { identity } = locale

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-50">
      <section
        aria-label="Identity"
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:gap-12 md:px-10 md:py-16"
      >
        <motion.div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="text-sm font-medium tracking-[0.2em] text-amber-400 uppercase">
            {identity.role}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {identity.displayName}
          </h1>
          <p className="max-w-prose text-lg text-neutral-300">{identity.bio}</p>
          <p className="text-sm font-medium text-emerald-400">{identity.availability}</p>
        </motion.div>

        <motion.div className="shrink-0">
          <img
            src={portraitSrc}
            alt={identity.portraitAlt}
            width={320}
            height={320}
            className="size-64 rounded-sm object-cover md:size-80"
          />
        </motion.div>
      </section>
    </main>
  )
}
