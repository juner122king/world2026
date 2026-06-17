import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'

const fallbackContentPath = fileURLToPath(new URL('../../public-data/data/worldcup2026.json', import.meta.url))

const flagCodeByTeamCode = {
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
  CUW: 'cw',
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

const chineseNameByTeamName = {
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
  'Cabo Verde': '佛得角',
  Colombia: '哥伦比亚',
  'Congo DR': '刚果(金)',
  Croatia: '克罗地亚',
  Curacao: '库拉索',
  'Curaçao': '库拉索',
  Czechia: '捷克',
  Ecuador: '厄瓜多尔',
  Egypt: '埃及',
  England: '英格兰',
  France: '法国',
  Germany: '德国',
  Ghana: '加纳',
  Haiti: '海地',
  Iran: '伊朗',
  'IR Iran': '伊朗',
  Iraq: '伊拉克',
  Japan: '日本',
  Jordan: '约旦',
  'Korea Republic': '韩国',
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
  'South Korea': '韩国',
  Spain: '西班牙',
  Sweden: '瑞典',
  Switzerland: '瑞士',
  Tunisia: '突尼斯',
  Turkey: '土耳其',
  Uruguay: '乌拉圭',
  USA: '美国',
  'United States': '美国',
  Uzbekistan: '乌兹别克斯坦',
  "Cote d'Ivoire": '科特迪瓦',
  "Côte d'Ivoire": '科特迪瓦',
}

const flagCodeByTeamName = {
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
  'Cabo Verde': 'cv',
  Colombia: 'co',
  'Congo DR': 'cd',
  Croatia: 'hr',
  Curacao: 'cw',
  'Curaçao': 'cw',
  Czechia: 'cz',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Haiti: 'ht',
  Iran: 'ir',
  'IR Iran': 'ir',
  Iraq: 'iq',
  Japan: 'jp',
  Jordan: 'jo',
  'Korea Republic': 'kr',
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
  'South Korea': 'kr',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  Uruguay: 'uy',
  USA: 'us',
  'United States': 'us',
  Uzbekistan: 'uz',
  "Cote d'Ivoire": 'ci',
  "Côte d'Ivoire": 'ci',
}

function getEnvString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getEnvNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value.data)) {
      return value.data
    }

    if (Array.isArray(value.response)) {
      return value.response
    }
  }

  return []
}

function localizeTeamName(name) {
  return chineseNameByTeamName[name] || name
}

function resolveFlagCode(code, name) {
  const normalizedCode = getEnvString(code).toUpperCase()

  if (normalizedCode && flagCodeByTeamCode[normalizedCode]) {
    return flagCodeByTeamCode[normalizedCode]
  }

  if (flagCodeByTeamName[name]) {
    return flagCodeByTeamName[name]
  }

  return normalizedCode.length === 2 ? normalizedCode.toLowerCase() : 'un'
}

function createTeam(name, code) {
  const localizedName = localizeTeamName(name)

  return {
    flagCode: resolveFlagCode(code, name),
    name: localizedName,
  }
}

function extractGroupLetter(value) {
  const groupValue = getEnvString(value)

  if (!groupValue) {
    return ''
  }

  const directMatch = groupValue.match(/^([A-L])$/i)

  if (directMatch) {
    return directMatch[1].toUpperCase()
  }

  const groupMatch = groupValue.match(/group\s*([A-L])/i) || groupValue.match(/小组\s*([A-L])/i)

  if (groupMatch) {
    return groupMatch[1].toUpperCase()
  }

  return ''
}

function normalizeMatchStatus(rawStatus) {
  const status = getEnvString(rawStatus).toLowerCase()

  if (status === 'completed' || status === 'finished' || status === 'ft') {
    return 'finished'
  }

  if (status === 'live' || status === 'in_progress' || status === 'playing') {
    return 'live'
  }

  return 'scheduled'
}

function getStatusLabel(status) {
  if (status === 'finished') {
    return '已完赛'
  }

  if (status === 'live') {
    return '进行中'
  }

  return undefined
}

function getMonthLabel(month) {
  if (month === '6') {
    return '六月'
  }

  if (month === '7') {
    return '七月'
  }

  return `${month}月`
}

function buildVenue(fixture) {
  const city = getEnvString(fixture.stadium_city, '城市待定')
  const country = getEnvString(fixture.stadium_country)

  return [
    getEnvString(fixture.stadium, '场馆待定'),
    country ? `${city}，${country}` : city,
  ]
}

function loadFallbackContent() {
  return readFile(fallbackContentPath, 'utf8').then((content) => JSON.parse(content))
}

function buildScheduleDays(fixtures) {
  const daysByKey = new Map()

  for (const rawFixture of fixtures) {
    const fixture = rawFixture && typeof rawFixture === 'object' ? rawFixture : {}
    const kickoff = getEnvString(fixture.kickoff_utc || fixture.date)

    if (!kickoff) {
      continue
    }

    const date = new Date(kickoff)
    const chinaParts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date)
    const parts = Object.fromEntries(chinaParts.map((part) => [part.type, part.value]))
    const sortKey = `${date.getUTCFullYear()}-${parts.month.padStart(2, '0')}-${parts.day.padStart(2, '0')}`
    const status = normalizeMatchStatus(fixture.status)
    const homeScore = getEnvNumber(fixture.home_score)
    const awayScore = getEnvNumber(fixture.away_score)
    const letter = extractGroupLetter(getEnvString(fixture.group_name, getEnvString(fixture.group, getEnvString(fixture.round))))
    const groupLabel = letter ? `${letter}组` : getEnvString(fixture.group_name, getEnvString(fixture.round, '世界杯'))
    const currentDay = daysByKey.get(sortKey) || {
      day: String(Number(parts.day)),
      month: getMonthLabel(parts.month),
      weekday: parts.weekday,
      matches: [],
    }

    currentDay.matches.push({
      time: `${parts.hour}:${parts.minute}`,
      home: createTeam(getEnvString(fixture.home_team), getEnvString(fixture.home_team_code)),
      away: createTeam(getEnvString(fixture.away_team), getEnvString(fixture.away_team_code)),
      group: groupLabel,
      venue: buildVenue(fixture),
      status,
      statusLabel: getStatusLabel(status),
      score: homeScore !== null && awayScore !== null ? { home: homeScore, away: awayScore } : undefined,
    })

    daysByKey.set(sortKey, currentDay)
  }

  return Array.from(daysByKey.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, day]) => day)
}

function createStandingEntry(team) {
  return {
    rank: 0,
    team: { ...team },
    played: 0,
    won: 0,
    draw: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }
}

function ensureGroupTable(tableByLetter, group) {
  let table = tableByLetter.get(group.letter)

  if (table) {
    return table
  }

  table = new Map()

  for (const team of group.teams) {
    const key = `${team.flagCode}:${team.name}`
    table.set(key, createStandingEntry(team))
  }

  tableByLetter.set(group.letter, table)
  return table
}

function findGroupTeam(group, team) {
  return group.teams.find((candidate) => candidate.flagCode === team.flagCode)
    || group.teams.find((candidate) => candidate.name === team.name)
    || team
}

function ensureStandingTeam(table, team) {
  const key = `${team.flagCode}:${team.name}`

  if (!table.has(key)) {
    table.set(key, createStandingEntry(team))
  }

  return table.get(key)
}

function applyResult(entry, goalsFor, goalsAgainst) {
  entry.played += 1
  entry.goalsFor += goalsFor
  entry.goalsAgainst += goalsAgainst
  entry.goalDifference = entry.goalsFor - entry.goalsAgainst

  if (goalsFor > goalsAgainst) {
    entry.won += 1
    entry.points += 3
    return
  }

  if (goalsFor === goalsAgainst) {
    entry.draw += 1
    entry.points += 1
    return
  }

  entry.lost += 1
}

function buildGroups(fixtures, fallbackGroups) {
  const fallbackGroupsByLetter = new Map(fallbackGroups.map((group) => [group.letter, group]))
  const tablesByLetter = new Map()

  for (const rawFixture of fixtures) {
    const fixture = rawFixture && typeof rawFixture === 'object' ? rawFixture : {}
    const letter = extractGroupLetter(getEnvString(fixture.group_name, getEnvString(fixture.group, getEnvString(fixture.round))))
    const group = fallbackGroupsByLetter.get(letter)

    if (!group) {
      continue
    }

    const status = normalizeMatchStatus(fixture.status)
    const homeScore = getEnvNumber(fixture.home_score)
    const awayScore = getEnvNumber(fixture.away_score)

    if ((status !== 'live' && status !== 'finished') || homeScore === null || awayScore === null) {
      continue
    }

    const table = ensureGroupTable(tablesByLetter, group)
    const homeTeam = findGroupTeam(group, createTeam(getEnvString(fixture.home_team), getEnvString(fixture.home_team_code)))
    const awayTeam = findGroupTeam(group, createTeam(getEnvString(fixture.away_team), getEnvString(fixture.away_team_code)))
    const homeEntry = ensureStandingTeam(table, homeTeam)
    const awayEntry = ensureStandingTeam(table, awayTeam)

    applyResult(homeEntry, homeScore, awayScore)
    applyResult(awayEntry, awayScore, homeScore)
  }

  return fallbackGroups.map((group) => {
    const table = tablesByLetter.get(group.letter)

    if (!table) {
      return group
    }

    const standings = Array.from(table.values())
      .sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points
        }

        if (right.goalDifference !== left.goalDifference) {
          return right.goalDifference - left.goalDifference
        }

        if (right.goalsFor !== left.goalsFor) {
          return right.goalsFor - left.goalsFor
        }

        return left.team.name.localeCompare(right.team.name, 'zh-CN')
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    return {
      ...group,
      standings,
    }
  })
}

async function fetchFixtures(env) {
  const headers = { Accept: 'application/json' }
  const apiKey = env.FOOTBALL_API_KEY

  if (apiKey) {
    const keyHeader = env.FOOTBALL_API_KEY_HEADER || 'Authorization'
    const scheme = env.FOOTBALL_API_AUTH_SCHEME || ''
    headers[keyHeader] = scheme ? `${scheme} ${apiKey}` : apiKey
  }

  const baseUrl = env.FOOTBALL_API_BASE_URL || 'https://api.wc2026api.com'
  const fixturesPath = env.FOOTBALL_API_FIXTURES_PATH || '/matches'
  const response = await fetch(new URL(fixturesPath, baseUrl), { headers })

  if (!response.ok) {
    throw new Error(`Provider request failed: ${response.status} ${response.statusText}`)
  }

  return asArray(await response.json())
}

export async function buildDevContent(env) {
  const fallbackContent = await loadFallbackContent()
  const fixtures = await fetchFixtures(env)
  const scheduleDays = buildScheduleDays(fixtures)
  const matchCount = scheduleDays.reduce((sum, day) => sum + day.matches.length, 0)
  const groups = buildGroups(fixtures, fallbackContent.groups)

  return {
    ...fallbackContent,
    meta: {
      ...fallbackContent.meta,
      updatedAt: new Date().toISOString(),
      sources: ['wc2026api', ...fallbackContent.meta.sources.filter((source) => source !== 'wc2026api')],
    },
    groups,
    schedule: {
      ...fallbackContent.schedule,
      note: `开发环境赛程由 provider 实时生成 · 当前快照包含 ${matchCount} 场比赛`,
      days: scheduleDays,
    },
    overview: {
      ...fallbackContent.overview,
      stats: fallbackContent.overview.stats.map((stat) => (
        stat.label === '比赛场次' && matchCount > 0 ? { ...stat, value: String(matchCount) } : stat
      )),
    },
  }
}

export function createDevContentPlugin(env) {
  return {
    name: 'world2026-dev-content',
    configureServer(server) {
      server.middlewares.use('/api/content/worldcup2026', async (_req, res) => {
        try {
          const content = await buildDevContent(env)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(content))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to build development content',
          }))
        }
      })
    },
  }
}
