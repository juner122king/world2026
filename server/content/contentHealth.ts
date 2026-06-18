import type { WorldCupContent } from '@world2026/content-contract'

function countMatches(content: WorldCupContent) {
  return content.schedule.days.reduce((total, day) => total + day.matches.length, 0)
}

function hasStandings(content: WorldCupContent) {
  return content.groups.some((group) => Array.isArray(group.standings) && group.standings.length > 0)
}

export function hasCoreContentData(content: WorldCupContent) {
  return countMatches(content) > 0 && hasStandings(content)
}
