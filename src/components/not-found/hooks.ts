import { useEffect, useRef, useState } from 'react'

export const notFoundRedirectSeconds = 10

/** Counts down once per second, then fires `onDone` once at zero. */
export function useCountdown(from: number, onDone: () => void) {
  const [remaining, setRemaining] = useState(from)
  const onDoneRef = useRef(onDone)
  const done = useRef(false)
  onDoneRef.current = onDone

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((n) => {
        if (n <= 1) {
          window.clearInterval(id)
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (remaining > 0 || done.current) return
    done.current = true
    onDoneRef.current()
  }, [remaining])

  return remaining
}
