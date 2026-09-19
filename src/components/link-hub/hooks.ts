import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

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
export function useOsDark() {
  return useSyncExternalStore(subscribeOsDark, getOsDark, () => false)
}

/** A message that shows itself for a beat and then clears. */
export function useTransientMessage(durationMs = messageDurationMs) {
  const [current, setCurrent] = useState<{ text: string } | null>(null)

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => setCurrent(null), durationMs)
    return () => clearTimeout(timer)
  }, [current, durationMs])

  const show = useCallback((text: string) => setCurrent({ text }), [])

  return [current?.text ?? null, show] as const
}
