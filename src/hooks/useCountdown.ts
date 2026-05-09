import { useEffect, useState } from 'react'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type CountdownStatus = 'loading' | 'countdown' | 'live' | 'invalid'
export type CountdownPulsePhase = 'a' | 'b' | 'idle'

export interface CountdownState {
  status: CountdownStatus
  days: string
  hours: string
  minutes: string
  seconds: string
  compactText: string
  pulsePhase: CountdownPulsePhase
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function makePendingState(status: CountdownStatus, compactText: string): CountdownState {
  return {
    status,
    days: '--',
    hours: '--',
    minutes: '--',
    seconds: '--',
    compactText,
    pulsePhase: 'idle',
  }
}

function getCountdownState(openingDate: string): CountdownState {
  if (!openingDate) {
    return makePendingState('loading', '--:--:--:--')
  }

  const openingTime = Date.parse(openingDate)

  if (Number.isNaN(openingTime)) {
    return makePendingState('invalid', 'TIME TBC')
  }

  const diff = openingTime - Date.now()

  if (diff <= 0) {
    return {
      status: 'live',
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
      compactText: 'LIVE NOW',
      pulsePhase: 'idle',
    }
  }

  const days = Math.floor(diff / DAY)
  const hours = Math.floor((diff % DAY) / HOUR)
  const minutes = Math.floor((diff % HOUR) / MINUTE)
  const seconds = Math.floor((diff % MINUTE) / SECOND)

  return {
    status: 'countdown',
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    compactText: `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    pulsePhase: seconds % 2 === 0 ? 'a' : 'b',
  }
}

export function useCountdown(openingDate: string) {
  const [countdown, setCountdown] = useState<CountdownState>(() => getCountdownState(openingDate))

  useEffect(() => {
    const nextCountdown = getCountdownState(openingDate)
    setCountdown(nextCountdown)

    if (nextCountdown.status !== 'countdown') {
      return undefined
    }

    const timer = window.setInterval(() => {
      setCountdown(getCountdownState(openingDate))
    }, SECOND)

    return () => window.clearInterval(timer)
  }, [openingDate])

  return countdown
}
