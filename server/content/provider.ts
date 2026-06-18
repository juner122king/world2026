import { getFallbackContent } from './fallbackContent.js'
import { asArray, buildGroupStandings, buildScheduleDays } from './transform.js'
import type { WorldCupContent } from '@world2026/content-contract'

interface ProviderPayload {
  fixtures: unknown[]
  standings: unknown[]
  teams: unknown[]
  venues: unknown[]
}

type FootballProvider = 'wc2026api' | 'api-football'

function getProvider(): FootballProvider {
  const provider = process.env.FOOTBALL_API_PROVIDER

  return provider === 'api-football' ? 'api-football' : 'wc2026api'
}

function buildRequestHeaders() {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  const apiKey = process.env.FOOTBALL_API_KEY

  if (!apiKey) {
    return headers
  }

  const provider = getProvider()
  const keyHeader = process.env.FOOTBALL_API_KEY_HEADER || (provider === 'wc2026api' ? 'Authorization' : 'x-apisports-key')
  const authScheme = process.env.FOOTBALL_API_AUTH_SCHEME ?? (provider === 'wc2026api' ? 'Bearer' : '')
  headers[keyHeader] = authScheme ? `${authScheme} ${apiKey}` : apiKey

  return headers
}

async function fetchProviderEndpoint(path: string) {
  const provider = getProvider()
  const baseUrl = process.env.FOOTBALL_API_BASE_URL || (
    provider === 'wc2026api' ? 'https://api.wc2026api.com' : 'https://v3.football.api-sports.io'
  )

  if (!baseUrl) {
    throw new Error('FOOTBALL_API_BASE_URL is required for sync')
  }

  const url = new URL(path, baseUrl)
  const response = await fetch(url, { headers: buildRequestHeaders() })

  if (!response.ok) {
    throw new Error(`Football API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<unknown>
}

export async function fetchProviderPayload(): Promise<ProviderPayload> {
  const provider = getProvider()
  const defaults = provider === 'wc2026api'
    ? {
        fixtures: '/matches',
        standings: '/standings',
        teams: '/teams',
        venues: '/stadiums',
      }
    : {
        fixtures: '/fixtures?league=1&season=2026',
        standings: '/standings?league=1&season=2026',
        teams: '/teams?league=1&season=2026',
        venues: '/venues?league=1&season=2026',
      }

  const [fixtures, standings, teams, venues] = await Promise.all([
    fetchProviderEndpoint(process.env.FOOTBALL_API_FIXTURES_PATH || defaults.fixtures),
    fetchProviderEndpoint(process.env.FOOTBALL_API_STANDINGS_PATH || defaults.standings).catch(() => []),
    fetchProviderEndpoint(process.env.FOOTBALL_API_TEAMS_PATH || defaults.teams).catch(() => []),
    fetchProviderEndpoint(process.env.FOOTBALL_API_VENUES_PATH || defaults.venues).catch(() => []),
  ])

  return {
    fixtures: asArray(fixtures),
    standings: asArray(standings),
    teams: asArray(teams),
    venues: asArray(venues),
  }
}

export function mapProviderPayloadToContent(payload: ProviderPayload, syncedAt = new Date().toISOString()): WorldCupContent {
  const fallbackContent = getFallbackContent()
  const scheduleDays = buildScheduleDays(payload.fixtures)
  const matchCount = scheduleDays.reduce((total, day) => total + day.matches.length, 0)
  const fallbackGroups = Array.isArray(fallbackContent.groups) ? fallbackContent.groups : []
  const groups = buildGroupStandings(fallbackGroups, payload.fixtures, payload.standings)

  return {
    ...fallbackContent,
    meta: {
      ...fallbackContent.meta,
      updatedAt: syncedAt,
      sources: [getProvider(), ...fallbackContent.meta.sources.filter((source) => source !== getProvider())],
    },
    groups,
    schedule: {
      note: matchCount > 0
        ? `北京时间赛程由服务端同步生成 · 当前快照包含 ${matchCount} 场比赛`
        : fallbackContent.schedule.note,
      days: scheduleDays.length > 0 ? scheduleDays : fallbackContent.schedule.days,
    },
    overview: {
      ...fallbackContent.overview,
      stats: fallbackContent.overview.stats.map((stat) => (
        stat.label === '比赛场次' && matchCount > 0 ? { ...stat, value: String(matchCount) } : stat
      )),
    },
  }
}
