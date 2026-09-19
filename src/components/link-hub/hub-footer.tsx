import type { Locale } from '#/content/locale'

export function HubFooter({ credit, rights }: Locale['footer']) {
  return (
    <footer className="tile tile-static flex h-full min-h-16 w-full items-center px-4 py-3 text-left text-[var(--hub-muted)] md:text-center">
      <p className="min-w-0 w-full font-mono text-[12px] leading-4">
        {`${credit}. ${rights}`}
      </p>
    </footer>
  )
}
