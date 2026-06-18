import { getFallbackContent } from './fallbackContent.js'
import { formatChinaMatchDate } from './date.js'
import type { Group, GroupStandingEntry, GroupTeam, ScheduleDay, ScheduleMatch, ScheduleMatchStatus, WorldCupContent } from '@world2026/content-contract'

interface ProviderPayload {
  fixtures: unknown[]
  standings: unknown[]
  teams: unknown[]
  venues: unknown[]
}

type ProviderObject = Record<string, unknown>
type FootballProvider = 'wc2026api' | 'api-football'

const fifaCodeToFlagCode: Record<string, string> = {
  ALG: 'dz',
  ARG: 'ar',
  AUS: 'au',
  AUT: 'at',
  BEL: 'be',
  BIH: 'ba',
  BRA: 'br',
  CAN: 'ca',
  CIV: 'ci',
  COL: 'co',
  CPV: 'cv',
  COD: 'cd',
  CRC: 'cr',
  CRO: 'hr',
  CZE: 'cz',
  ECU: 'ec',
  EGY: 'eg',
  ENG: 'gb-eng',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  HAI: 'ht',
  IRN: 'ir',
  IRQ: 'iq',
  JPN: 'jp',
  JOR: 'jo',
  KOR: 'kr',
  MAR: 'ma',
  MEX: 'mx',
  NED: 'nl',
  NOR: 'no',
  NZL: 'nz',
  PAN: 'pa',
  PAR: 'py',
  POR: 'pt',
  QAT: 'qa',
  KSA: 'sa',
  SCO: 'gb-sct',
  SEN: 'sn',
  RSA: 'za',
  ESP: 'es',
  SUI: 'ch',
  SWE: 'se',
  TUN: 'tn',
  TUR: 'tr',
  URU: 'uy',
  USA: 'us',
  UZB: 'uz',
}

const teamNameToFlagCode: Record<string, string> = {
  Algeria: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Belgium: 'be',
  'Bosnia and Herzegovina': 'ba',
  'Bosnia-Herzegovina': 'ba',
  Brazil: 'br',
  Canada: 'ca',
  'Cape Verde': 'cv',
  Colombia: 'co',
  'Congo DR': 'cd',
  Curaçao: 'cw',
  Curacao: 'cw',
  Czechia: 'cz',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Haiti: 'ht',
  Iran: 'ir',
  Iraq: 'iq',
  Japan: 'jp',
  Jordan: 'jo',
  'Korea Republic': 'kr',
  'South Korea': 'kr',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Norway: 'no',
  Panama: 'pa',
  Paraguay: 'py',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  'South Africa': 'za',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  Uruguay: 'uy',
  USA: 'us',
  'United States': 'us',
  Uzbekistan: 'uz',
}

const teamNameToChineseName: Record<string, string> = {
  Algeria: '阿尔及利亚',
  Argentina: '阿根廷',
  Australia: '澳大利亚',
  Austria: '奥地利',
  Belgium: '比利时',
  'Bosnia and Herzegovina': '波黑',
  'Bosnia-Herzegovina': '波黑',
  Brazil: '巴西',
  Canada: '加拿大',
  'Cape Verde': '佛得角',
  Colombia: '哥伦比亚',
  'Congo DR': '刚果(金)',
  Curaçao: '库拉索',
  Curacao: '库拉索',
  Czechia: '捷克',
  Ecuador: '厄瓜多尔',
  Egypt: '埃及',
  England: '英格兰',
  France: '法国',
  Germany: '德国',
  Ghana: '加纳',
  Haiti: '海地',
  Iran: '伊朗',
  Iraq: '伊拉克',
  Japan: '日本',
  Jordan: '约旦',
  'Korea Republic': '韩国',
  'South Korea': '韩国',
  Mexico: '墨西哥',
  Morocco: '摩洛哥',
  Netherlands: '荷兰',
  'New Zealand': '新西兰',
  Norway: '挪威',
  Panama: '巴拿马',
  Paraguay: '巴拉圭',
  Portugal: '葡萄牙',
  Qatar: '卡塔尔',
  'Saudi Arabia': '沙特阿拉伯',
  Scotland: '苏格兰',
  Senegal: '塞内加尔',
  'South Africa': '南非',
  Spain: '西班牙',
  Sweden: '瑞典',
  Switzerland: '瑞士',
  Tunisia: '突尼斯',
  Turkey: '土耳其',
  Uruguay: '乌拉圭',
  USA: '美国',
  'United States': '美国',
  Uzbekistan: '乌兹别克斯坦',
}

function asObject(value: unknown): ProviderObject {
  return value && typeof value === 'object' ? (value as ProviderObject) : {}
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  const object = asObject(value)

  if (Array.isArray(object.response)) {
    return object.response
  }

  if (Array.isArray(object.data)) {
    return object.data
  }

  return []
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function getProvider(): FootballProvider {
  const provider = process.env.FOOTBALL_API_PROVIDER

  return provider === 'api-football' ? 'api-football' : 'wc2026api'
}

function resolveFlagCode(code: string, name: string, country: string) {
  const normalizedCode = code.toUpperCase()

  if (normalizedCode in fifaCodeToFlagCode) {
    return fifaCodeToFlagCode[normalizedCode]
  }

  if (name in teamNameToFlagCode) {
    return teamNameToFlagCode[name]
  }

  if (country in teamNameToFlagCode) {
    return teamNameToFlagCode[country]
  }

  return code.length === 2 ? code.toLowerCase() : 'un'
}

function localizeTeamName(name: string, country: string) {
  return teamNameToChineseName[name] ?? teamNameToChineseName[country] ?? name
}

function createTeam(rawTeam: unknown, fallbackName: string): GroupTeam {
  if (typeof rawTeam === 'string') {
    return {
      flagCode: resolveFlagCode('', rawTeam, rawTeam),
      name: localizeTeamName(rawTeam, rawTeam),
    }
  }

  const team = asObject(rawTeam)
  const name = getString(team.name, fallbackName)
  const code = getString(team.code)
  const country = getString(team.country)

  return {
    flagCode: resolveFlagCode(code, name, country),
    name: localizeTeamName(name, country),
  }
}

function extractGroupLetter(value: string) {
  const matches = value.match(/[A-L]/gi)

  if (!matches || matches.length === 0) {
    return ''
  }

  if (/group|组/i.test(value)) {
    return matches[matches.length - 1].toUpperCase()
  }

  return matches[0].toUpperCase()
}

function normalizeGroupCode(value: string) {
  const letter = extractGroupLetter(value)
  return letter ? `${letter}组` : value
}

function mapFixtureStatus(rawFixture: ProviderObject): { status: ScheduleMatchStatus; label?: string } {
  const fixtureMeta = asObject(rawFixture.fixture)
  const statusMeta = asObject(fixtureMeta.status)
  const short = getString(statusMeta.short).toUpperCase()
  const long = getString(statusMeta.long)
  const rawStatus = getString(rawFixture.status)
  const normalized = short || rawStatus.toUpperCase()

  if (['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO'].includes(normalized)) {
    return { status: 'finished', label: long || '已完赛' }
  }

  if (['COMPLETED', 'FINISHED'].includes(normalized)) {
    return { status: 'finished', label: long || '已完赛' }
  }

  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY', 'IN_PROGRESS', 'PLAYING'].includes(normalized)) {
    return { status: 'live', label: long || '进行中' }
  }

  if (long) {
    return {
      status: long.includes('Live') ? 'live' : long.includes('Finished') ? 'finished' : 'scheduled',
      label: long,
    }
  }

  return { status: 'scheduled' }
}

function mapFixtureScore(rawFixture: ProviderObject) {
  const goals = asObject(rawFixture.goals)
  const score = asObject(rawFixture.score)
  const fulltime = asObject(score.fulltime)
  const home = getNumber(goals.home, getNumber(fulltime.home, getNumber(rawFixture.home_score, Number.NaN)))
  const away = getNumber(goals.away, getNumber(fulltime.away, getNumber(rawFixture.away_score, Number.NaN)))

  if (!Number.isFinite(home) || !Number.isFinite(away)) {
    return undefined
  }

  return {
    home,
    away,
  }
}

function getFixtureDate(rawFixture: ProviderObject) {
  const fixture = asObject(rawFixture.fixture)
  const rawDate =
    fixture.date ??
    rawFixture.kickoff_utc ??
    rawFixture.date ??
    rawFixture.utcDate ??
    rawFixture.kickoff

  if (typeof rawDate === 'string' || typeof rawDate === 'number') {
    return rawDate
  }

  return null
}

function mapFixtureToMatch(rawFixture: unknown): { key: string; match: ScheduleMatch } | null {
  const fixture = asObject(rawFixture)
  const dateInput = getFixtureDate(fixture)

  if (!dateInput) {
    return null
  }

  const teams = asObject(fixture.teams)
  const home = createTeam(teams.home ?? fixture.home_team, '待定')
  const away = createTeam(teams.away ?? fixture.away_team, '待定')
  const league = asObject(fixture.league)
  const fixtureMeta = asObject(fixture.fixture)
  const venue = asObject(fixtureMeta.venue ?? fixture.venue)
  const date = formatChinaMatchDate(dateInput)
  const groupName = getString(fixture.group_name)
  const round = getString(fixture.round, getString(league.round, getString(fixture.group, '世界杯')))
  const stadium = getString(fixture.stadium)
  const city = getString(fixture.city, getString(fixture.stadium_city, getString(venue.city, '城市待定')))
  const matchStatus = mapFixtureStatus(fixture)
  const score = mapFixtureScore(fixture)

  return {
    key: date.key,
    match: {
      time: date.time,
      home,
      away,
      group: groupName ? normalizeGroupCode(groupName) : round,
      venue: [
        getString(venue.name, stadium || '场馆待定'),
        city,
      ],
      status: matchStatus.status,
      score,
      statusLabel: matchStatus.label,
    },
  }
}

function buildScheduleDays(fixtures: unknown[]): ScheduleDay[] {
  const grouped = new Map<string, ScheduleDay>()

  for (const fixture of fixtures) {
    const mapped = mapFixtureToMatch(fixture)

    if (!mapped) {
      continue
    }

    const date = formatChinaMatchDate(getFixtureDate(asObject(fixture)) ?? '')
    const current = grouped.get(mapped.key) ?? {
      day: date.day,
      month: date.month,
      weekday: date.weekday,
      matches: [],
    }

    current.matches.push(mapped.match)
    grouped.set(mapped.key, current)
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, day]) => day)
}

function getStandingsRows(rawStanding: unknown) {
  const standing = asObject(rawStanding)
  const league = asObject(standing.league)
  const rows = standing.standings ?? league.standings

  if (Array.isArray(rows)) {
    if (rows.length > 0 && Array.isArray(rows[0])) {
      return rows.flatMap((entry) => (Array.isArray(entry) ? entry : []))
    }

    return rows
  }

  return []
}

function createStandingEntry(rawEntry: unknown): GroupStandingEntry | null {
  const entry = asObject(rawEntry)
  const all = asObject(entry.all)
  const goals = asObject(all.goals)
  const team = createTeam(entry.team, getString(entry.name, '待定'))
  const rank = getNumber(entry.rank, getNumber(entry.position, 0))
  const played = getNumber(all.played, getNumber(entry.played, 0))
  const won = getNumber(all.win, getNumber(entry.won, 0))
  const draw = getNumber(all.draw, getNumber(entry.draw, 0))
  const lost = getNumber(all.lose, getNumber(entry.lost, 0))
  const goalsFor = getNumber(goals.for, getNumber(entry.goals_for, 0))
  const goalsAgainst = getNumber(goals.against, getNumber(entry.goals_against, 0))
  const goalDifference = getNumber(entry.goalsDiff, getNumber(entry.goal_difference, goalsFor - goalsAgainst))
  const points = getNumber(entry.points, getNumber(entry.pts, 0))

  if (!team.name) {
    return null
  }

  return {
    rank: rank || 0,
    team,
    played,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
  }
}

function buildGroupStandings(standings: unknown[], fallbackGroups: Group[]) {
  const standingsByLetter = new Map<string, GroupStandingEntry[]>()

  for (const standing of standings) {
    const standingObject = asObject(standing)
    const league = asObject(standingObject.league)
    const groupName = getString(standingObject.group, getString(league.group))
    const rows = getStandingsRows(standing)
    const letter = extractGroupLetter(groupName)

    if (!letter || rows.length === 0) {
      continue
    }

    const entries = rows
      .map((row) => createStandingEntry(row))
      .filter((entry): entry is GroupStandingEntry => entry !== null)
      .sort((left, right) => {
        if (left.rank !== right.rank) {
          return left.rank - right.rank
        }

        if (right.points !== left.points) {
          return right.points - left.points
        }

        return right.goalDifference - left.goalDifference
      })

    if (entries.length > 0) {
      standingsByLetter.set(letter, entries)
    }
  }

  return fallbackGroups.map((group) => ({
    ...group,
    standings: standingsByLetter.get(group.letter) ?? group.standings,
  }))
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
  const groups = buildGroupStandings(payload.standings, fallbackGroups)

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
