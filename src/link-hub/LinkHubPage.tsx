import { useState } from 'react'
import { motion } from 'motion/react'

import type { AnalyticsPort } from '#/analytics/port'
import { hubLinks, type HubLink } from '#/content/hub-config'
import type { LinkCopy, Locale } from '#/content/locale'

export type LinkHubPageProps = {
  locale: Locale
  analytics: AnalyticsPort
  portraitSrc: string
  hubUrl: string
}

function isConfigured(
  link: HubLink,
): link is Extract<HubLink, { href: string }> {
  return 'href' in link
}

function controlLabel({ label, title }: Pick<LinkCopy, 'label' | 'title'>) {
  return `${label}: ${title}`
}

function TileCaption({ label, title, handle }: LinkCopy) {
  return (
    <>
      <span className="block text-xs tracking-[0.15em] text-neutral-400 uppercase">
        {label}
      </span>
      <span className="block text-lg font-medium">{title}</span>
      {handle ? (
        <span className="block text-sm text-neutral-400">{handle}</span>
      ) : null}
    </>
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
    <span
      className={
        tone === 'amber'
          ? 'mt-2 block text-sm text-amber-300'
          : 'mt-2 block text-sm text-emerald-400'
      }
      role="status"
    >
      {children}
    </span>
  )
}

const tileClass = 'border border-neutral-800 px-4 py-3 text-left'
const highlightedTileClass =
  'border border-amber-400/80 bg-amber-400/10 px-4 py-3 text-left'

export function LinkHubPage({
  locale,
  analytics: _analytics,
  portraitSrc,
  hubUrl,
}: LinkHubPageProps) {
  const { identity } = locale
  const [photosMessage, setPhotosMessage] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const copyAction = locale.actions['copy-url']

  async function copyHubUrl() {
    await navigator.clipboard.writeText(hubUrl)
    setCopyFeedback(copyAction.success)
  }

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
          <p className="text-sm font-medium text-emerald-400">
            {identity.availability}
          </p>
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

      <div className="mx-auto grid w-full max-w-5xl gap-3 px-6 pb-12 md:grid-cols-2 md:px-10">
        <section aria-label="Links" className="contents">
          {hubLinks.map((link) => {
            if (isConfigured(link)) {
              const copy = locale.links[link.id]
              const external = link.href.startsWith('http')

              return (
                <a
                  key={link.id}
                  href={link.href}
                  {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  aria-label={controlLabel(copy)}
                  data-highlighted={link.highlighted ? 'true' : undefined}
                  className={
                    link.highlighted ? highlightedTileClass : tileClass
                  }
                >
                  <TileCaption {...copy} />
                </a>
              )
            }

            const copy = locale.links.photos
            return (
              <button
                key={link.id}
                type="button"
                aria-label={controlLabel(copy)}
                className={tileClass}
                onClick={() => setPhotosMessage(copy.comingSoon)}
              >
                <TileCaption label={copy.label} title={copy.title} />
                {photosMessage ? (
                  <StatusMessage tone="amber">{photosMessage}</StatusMessage>
                ) : null}
              </button>
            )
          })}
        </section>

        <section aria-label="Actions" className="contents">
          <button
            type="button"
            aria-label={controlLabel(copyAction)}
            className={tileClass}
            onClick={() => {
              void copyHubUrl()
            }}
          >
            <TileCaption label={copyAction.label} title={copyAction.title} />
            {copyFeedback ? (
              <StatusMessage tone="emerald">{copyFeedback}</StatusMessage>
            ) : null}
          </button>
        </section>
      </div>
    </main>
  )
}
