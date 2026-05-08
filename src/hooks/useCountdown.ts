import { useEffect, useMemo, useState } from 'react'

function getCountdownLabel(openingDate: string) {
  const openingTime = new Date(openingDate).getTime()
  const diff = openingTime - Date.now()

  if (diff <= 0) {
    return '进行中'
  }

  return String(Math.floor(diff / 86400000))
}

export function useCountdown(openingDate: string) {
  const [label, setLabel] = useState(() => getCountdownLabel(openingDate))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLabel((currentLabel) => {
        const nextLabel = getCountdownLabel(openingDate)
        return currentLabel === nextLabel ? currentLabel : nextLabel
      })
    }, 60000)

    return () => window.clearInterval(timer)
  }, [openingDate])

  return useMemo(() => ({ label }), [label])
}
