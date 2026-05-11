import { CHINA_TIME_ZONE } from './constants.js'

const monthNames = [
  '',
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]

function getZonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function formatChinaMatchDate(dateInput: string | number | Date) {
  const date = new Date(dateInput)
  const parts = getZonedParts(date)
  const monthIndex = Number(parts.month)
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    weekday: 'short',
  }).format(date)

  return {
    key: `${parts.year}-${parts.month}-${parts.day}`,
    day: String(Number(parts.day)).padStart(2, '0'),
    month: monthNames[monthIndex] ?? `${monthIndex}月`,
    weekday,
    time: `${parts.hour}:${parts.minute}`,
  }
}
