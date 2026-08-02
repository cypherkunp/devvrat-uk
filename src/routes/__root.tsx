import { lazy, Suspense } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { loadLocale } from '#/content/locale'
import appCss from '../styles.css?url'

const locale = loadLocale('en')

const AppDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('#/devtools').then((m) => ({ default: m.AppDevtools })),
    )
  : null

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: locale.meta.documentTitle,
      },
      {
        name: 'theme-color',
        content: '#0a0a0a',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
        sizes: '48x48',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Entrance animation is server-rendered as opacity:0; without scripts
            nothing would ever animate it back in. */}
        <noscript>
          <style>{`[style*="opacity:0"] { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body>
        {children}
        {AppDevtools ? (
          <Suspense fallback={null}>
            <AppDevtools />
          </Suspense>
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
