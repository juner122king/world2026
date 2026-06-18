import { formatChinaMatchDate } from './date.js'
import { createTeam, findFallbackTeam } from './teamMaps.js'
import type { Group, GroupStandingEntry, ScheduleDay, ScheduleMatch, ScheduleMatchStatus } from '@world2026/content-contract'

type ProviderObject = Record<string, unknown>

// ── Generic helpers ────────────────────────────────────────────────

export function asObject(value: unknown): ProviderObject {
  return value && typeof value === 'object' ? (value as ProviderObject) : {}
}

export function asArray(value: unknown): unknown[] {
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

export function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function getNumber(value: unknown, fallback = 0): number {
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

// ── Group helpers ──────────────────────────────────────────────────

export function extractGroupLetter(value: string): string {
  const matches = value.match(/[A-L]/gi)

  if (!matches || matches.length === 0) {
    return ''
  }

  if (/group|组/i.test(value)) {
    return matches[matches.length - 1].toUpperCase()
  }

  return matches[0].toUpperCase()
}

export function normalizeGroupCode(value: string): string {
  const letter = extractGroupLetter(value)
  return letter ? `${letter}组` : value
}

// ── Fixture mapping ────────────────────────────────────────────────

export function mapFixtureStatus(rawFixture: ProviderObject): { status: ScheduleMatchStatus; label?: string } {
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

export function mapFixtureScore(rawFixture: ProviderObject): { home: number; away: number } | undefined {
  const goals = asObject(rawFixture.goals)
  const score = asObject(rawFixture.score)
  const fulltime = asObject(score.fulltime)
  const home = getNumber(goals.home, getNumber(fulltime.home, getNumber(rawFixture.home_score, Number.NaN)))
  const away = getNumber(goals.away, getNumber(fulltime.away, getNumber(rawFixture.away_score, Number.NaN)))

  if (!Number.isFinite(home) || !Number.isFinite(away)) {
    return undefined
  }

  return { home, away }
}

export function getFixtureDate(rawFixture: ProviderObject): string | number | null {
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

export function mapFixtureToMatch(rawFixture: unknown): { key: string; match: ScheduleMatch } | null {
  const fixture = asObject(rawFixture)
  const dateInput = getFixtureDate(fixture)

  if (!dateInput) {
    return null
  }

  const teams = asObject(fixture.teams)
  const home = createTeam(teams.home ?? fixture.home_team)
  const away = createTeam(teams.away ?? fixture.away_team)
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

export function buildScheduleDays(fixtures: unknown[]): ScheduleDay[] {
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

// ── Standings computation ──────────────────────────────────────────

export function computeStandingsFromFixtures(fixtures: unknown[], fallbackGroups: Group[]): Map<string, GroupStandingEntry[]> {
  const fallbackByLetter = new Map(fallbackGroups.map((g) => [g.letter, g]))
  const tablesByLetter = new Map<string, Map<string, GroupStandingEntry>>()

  for (const rawFixture of fixtures) {
    const fixture = asObject(rawFixture)
    const groupName = getString(fixture.group_name)
    const letter = groupName ? extractGroupLetter(groupName) : ''

    if (!letter || !fallbackByLetter.has(letter)) {
      continue
    }

    const matchStatus = mapFixtureStatus(fixture)
    if (matchStatus.status !== 'finished' && matchStatus.status !== 'live') {
      continue
    }

    const score = mapFixtureScore(fixture)
    if (!score) {
      continue
    }

    const fallbackGroup = fallbackByLetter.get(letter)!
    const teams = asObject(fixture.teams)
    const homeTeam = findFallbackTeam(fallbackGroup.teams, createTeam(teams.home ?? fixture.home_team))
    const awayTeam = findFallbackTeam(fallbackGroup.teams, createTeam(teams.away ?? fixture.away_team))

    if (!tablesByLetter.has(letter)) {
      tablesByLetter.set(letter, new Map())
    }

    const table = tablesByLetter.get(letter)!
    const homeKey = `${homeTeam.flagCode}:${homeTeam.name}`
    const awayKey = `${awayTeam.flagCode}:${awayTeam.name}`

    if (!table.has(homeKey)) {
      table.set(homeKey, { rank: 0, team: homeTeam, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })
    }

    if (!table.has(awayKey)) {
      table.set(awayKey, { rank: 0, team: awayTeam, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })
    }

    const homeEntry = table.get(homeKey)!
    const awayEntry = table.get(awayKey)!

    homeEntry.played += 1
    homeEntry.goalsFor += score.home
    homeEntry.goalsAgainst += score.away
    homeEntry.goalDifference = homeEntry.goalsFor - homeEntry.goalsAgainst

    awayEntry.played += 1
    awayEntry.goalsFor += score.away
    awayEntry.goalsAgainst += score.home
    awayEntry.goalDifference = awayEntry.goalsFor - awayEntry.goalsAgainst

    if (score.home > score.away) {
      homeEntry.won += 1
      homeEntry.points += 3
      awayEntry.lost += 1
    } else if (score.home < score.away) {
      awayEntry.won += 1
      awayEntry.points += 3
      homeEntry.lost += 1
    } else {
      homeEntry.draw += 1
      homeEntry.points += 1
      awayEntry.draw += 1
      awayEntry.points += 1
    }
  }

  const result = new Map<string, GroupStandingEntry[]>()

  for (const [letter, table] of tablesByLetter) {
    const sorted = Array.from(table.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
        return a.team.name.localeCompare(b.team.name, 'zh-CN')
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    if (sorted.length > 0) {
      result.set(letter, sorted)
    }
  }

  return result
}

export function buildGroupStandings(fallbackGroups: Group[], fixtures: unknown[], apiStandings?: unknown[]): Group[] {
  const standingsByLetter = new Map<string, GroupStandingEntry[]>()

  if (apiStandings) {
    for (const standing of apiStandings) {
      const standingObject = asObject(standing)
      const league = asObject(standingObject.league)
      const groupName = getString(standingObject.group, getString(league.group))
      const rows = getStandingsRows(standing)
      const letter = extractGroupLetter(groupName)

      if (!letter || rows.length === 0) {
        continue
      }

      const entries = rows
        .map((row) => createStandingEntryFromApi(row))
        .filter((entry): entry is GroupStandingEntry => entry !== null)
        .sort((left, right) => {
          if (left.rank !== right.rank) return left.rank - right.rank
          if (right.points !== left.points) return right.points - left.points
          return right.goalDifference - left.goalDifference
        })

      if (entries.length > 0) {
        standingsByLetter.set(letter, entries)
      }
    }
  }

  const computedStandings = computeStandingsFromFixtures(fixtures, fallbackGroups)

  return fallbackGroups.map((group) => ({
    ...group,
    standings: standingsByLetter.get(group.letter) ?? computedStandings.get(group.letter) ?? group.standings,
  }))
}

// ── API standings parsing (used when /standings endpoint works) ────

function getStandingsRows(rawStanding: unknown): unknown[] {
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

function createStandingEntryFromApi(rawEntry: unknown): GroupStandingEntry | null {
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
