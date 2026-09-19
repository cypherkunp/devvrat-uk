import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadLocale } from '#/content/locale'
import { NotFoundPage } from '#/components/not-found/not-found-page'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Not Found page', () => {
  it('shows the 404 heading and a 10 second homepage countdown on the Geist grid', () => {
    render(<NotFoundPage locale={loadLocale('en')} onRedirect={() => {}} />)

    expect(document.querySelector('.hub-grid')).toBeTruthy()
    expect(document.querySelector('.geist-grid')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeTruthy()
    expect(
      screen.getByText('Looks like you have wandered off the map'),
    ).toBeTruthy()
    expect(
      screen.getByText('Redirecting you to the homepage in 10'),
    ).toBeTruthy()
  })

  it('ticks the countdown every second then sends the visitor home', () => {
    const onRedirect = vi.fn()
    render(<NotFoundPage locale={loadLocale('en')} onRedirect={onRedirect} />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(
      screen.getByText('Redirecting you to the homepage in 9'),
    ).toBeTruthy()
    expect(onRedirect).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(
      screen.getByText('Redirecting you to the homepage in 0'),
    ).toBeTruthy()
    expect(onRedirect).toHaveBeenCalledTimes(1)
  })
})
