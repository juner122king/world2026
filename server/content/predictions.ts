import { fallbackContent } from './fallbackContent.js'
import type {
  GroupTeam,
  MatchPrediction,
  MatchPredictionRequest,
  OverallPredictionSummary,
  PredictionFavorite,
  PredictionTeamRef,
  WorldCupContent,
} from '@world2026/content-contract'

const MATCH_PREDICTION_MODEL_VERSION = 'heuristic-v1'
const HOST_COUNTRIES = ['us', 'ca', 'mx'] as const
type HostCountry = (typeof HOST_COUNTRIES)[number]

const seededTeams: Array<{ name: string; probability: number; insight: string }> = [
  { name: '西班牙', probability: 18, insight: '签位稳定，技术体系成熟，淘汰赛上限仍然最高。' },
  { name: '英格兰', probability: 16, insight: '阵容深度充足，边路推进和定位球仍是核心优势。' },
  { name: '法国', probability: 15, insight: '关键点在于中前场转换效率与防线健康度。' },
  { name: '巴西', probability: 14, insight: '上限取决于前场个人能力能否持续兑现。' },
  { name: '阿根廷', probability: 13, insight: '卫冕经验让比赛管理能力依旧突出。' },
]

const staticTeamStrengthByFlagCode: Record<string, number> = {
  ar: 82,
  at: 67,
  au: 66,
  ba: 65,
  be: 74,
  br: 84,
  ca: 68,
  cd: 59,
  ch: 73,
  ci: 67,
  co: 72,
  cv: 57,
  cw: 58,
  cz: 68,
  de: 80,
  dz: 65,
  ec: 68,
  eg: 63,
  es: 86,
  fr: 83,
  'gb-eng': 84,
  'gb-sct': 68,
  gh: 64,
  hr: 74,
  ht: 55,
  iq: 60,
  ir: 63,
  jo: 58,
  jp: 71,
  kr: 70,
  ma: 72,
  mx: 71,
  nl: 78,
  no: 68,
  nz: 61,
  pa: 62,
  pt: 77,
  py: 67,
  qa: 61,
  sa: 62,
  se: 69,
  sn: 70,
  tn: 64,
  tr: 68,
  us: 72,
  uy: 74,
  uz: 59,
  za: 64,
}

const favoriteRankStrength: Record<string, number> = {
  '01': 86,
  '02': 84,
  '03': 83,
  '04': 82,
  '05': 81,
  '06': 79,
  '07': 78,
  '08': 77,
}

interface MatchPredictionContext {
  matchKey: string
  day: MatchPredictionRequest['day']
  match: MatchPredictionRequest['match']
  basisUpdatedAt: string
  content: WorldCupContent
}

interface TeamProfile extends PredictionTeamRef {
  strength: number
  champion: boolean
  debut: boolean
}

export interface MatchPredictionSignals {
  homeRating: number
  awayRating: number
  groupStage: boolean
  sameTier: boolean
  hostCountry: HostCountry | null
  homeHostAdvantage: boolean
  awayHostAdvantage: boolean
  homeChampion: boolean
  awayChampion: boolean
  homeDebut: boolean
  awayDebut: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function findTeam(content: WorldCupContent, name: string): PredictionTeamRef {
  for (const group of content.groups) {
    const team = group.teams.find((candidate) => candidate.name === name)

    if (team) {
      return {
        flagCode: team.flagCode,
        name: team.name,
      }
    }
  }

  return {
    flagCode: 'un',
    name,
  }
}

function createMatchPredictionKey(day: Pick<MatchPredictionRequest['day'], 'day' | 'month'>, match: Pick<MatchPredictionRequest['match'], 'time' | 'home' | 'away'>) {
  return [day.month, day.day, match.time, match.home.name, match.away.name]
    .map((part) => part.trim().toLowerCase())
    .join('__')
}

function buildFavoriteStrengthMap(content: WorldCupContent) {
  const favoriteStrength = new Map<string, number>()

  for (const favorite of content.overview.favorites) {
    const strength = favoriteRankStrength[favorite.rank]

    if (!strength) {
      continue
    }

    favoriteStrength.set(favorite.flagCode, strength)
    favoriteStrength.set(favorite.name, strength)
  }

  return favoriteStrength
}

function findGroupTeam(content: WorldCupContent, reference: PredictionTeamRef): GroupTeam | null {
  for (const group of content.groups) {
    const team = group.teams.find((candidate) => (
      candidate.flagCode === reference.flagCode
      || candidate.name === reference.name
    ))

    if (team) {
      return team
    }
  }

  return null
}

function resolveTeamProfile(reference: PredictionTeamRef, content: WorldCupContent): TeamProfile {
  const favoriteStrength = buildFavoriteStrengthMap(content)
  const groupTeam = findGroupTeam(content, reference)
  const flagCode = groupTeam?.flagCode ?? reference.flagCode
  const name = groupTeam?.name ?? reference.name
  const staticStrength = staticTeamStrengthByFlagCode[flagCode]
  const favoriteBoost = favoriteStrength.get(flagCode) ?? favoriteStrength.get(name)
  const strength = Math.max(staticStrength ?? 64, favoriteBoost ?? 0)

  return {
    flagCode,
    name,
    strength,
    champion: groupTeam?.champion ?? false,
    debut: groupTeam?.debut ?? false,
  }
}

function inferHostCountry(match: MatchPredictionRequest['match']): HostCountry | null {
  const rawVenue = match.venue.join(' ').toLowerCase()
  const hostMarkers: Array<{ flagCode: HostCountry; keywords: string[] }> = [
    { flagCode: 'us', keywords: ['美国', 'united states', 'usa', 'new jersey', 'los angeles', 'houston', 'atlanta', 'miami', 'dallas', 'seattle', 'boston', 'inglewood', 'san francisco'] },
    { flagCode: 'ca', keywords: ['加拿大', 'canada', 'toronto', 'vancouver', 'bc place'] },
    { flagCode: 'mx', keywords: ['墨西哥', 'mexico', 'guadalajara', 'zapopan', 'mexico city'] },
  ]

  for (const marker of hostMarkers) {
    if (marker.keywords.some((keyword) => rawVenue.includes(keyword))) {
      return marker.flagCode
    }
  }

  return null
}

function createReasoning(home: TeamProfile, away: TeamProfile, match: MatchPredictionRequest['match'], signals: MatchPredictionSignals) {
  const reasons: string[] = []
  const ratingGap = signals.homeRating - signals.awayRating
  const absoluteGap = Math.abs(ratingGap)

  if (absoluteGap >= 12) {
    const stronger = ratingGap > 0 ? home.name : away.name
    reasons.push(`${stronger} 的整体实力基线明显更高，常规时间胜面会被优先抬升。`)
  } else if (signals.sameTier) {
    reasons.push(`${home.name} 与 ${away.name} 的基础强度接近，模型会主动保留更高的胶着概率。`)
  } else {
    reasons.push(`${home.name} 与 ${away.name} 存在一定实力差，但还不足以把比赛判断成单边走势。`)
  }

  if (signals.homeHostAdvantage) {
    reasons.push(`${match.venue[1] ?? match.venue[0]} 的主办地环境对 ${home.name} 提供了轻微熟悉度加成。`)
  } else if (signals.awayHostAdvantage) {
    reasons.push(`${match.venue[1] ?? match.venue[0]} 的主办地环境对 ${away.name} 提供了轻微熟悉度加成。`)
  } else if (signals.groupStage) {
    reasons.push('小组赛阶段通常更强调风险控制，平局概率会被保留在较高区间。')
  } else {
    reasons.push('淘汰赛会降低平局占比，模型会更快把概率分配给胜负两端。')
  }

  if (home.champion) {
    reasons.push(`${home.name} 的卫冕或冠军经验提升了比赛管理稳定性。`)
  } else if (away.champion) {
    reasons.push(`${away.name} 的卫冕或冠军经验提升了比赛管理稳定性。`)
  } else if (home.debut) {
    reasons.push(`${home.name} 作为首次参赛队，模型会下调其高压比赛稳定性。`)
  } else if (away.debut) {
    reasons.push(`${away.name} 作为首次参赛队，模型会下调其高压比赛稳定性。`)
  }

  return reasons.slice(0, 4)
}

function normalizeProbabilities(home: number, draw: number, away: number) {
  const ranges = {
    home: { min: 18, max: 68 },
    draw: { min: 12, max: 34 },
    away: { min: 18, max: 68 },
  }
  const probabilities = {
    home: clamp(Math.round(home), ranges.home.min, ranges.home.max),
    draw: clamp(Math.round(draw), ranges.draw.min, ranges.draw.max),
    away: clamp(Math.round(away), ranges.away.min, ranges.away.max),
  }

  const keys: Array<keyof typeof probabilities> = ['home', 'draw', 'away']
  let total = probabilities.home + probabilities.draw + probabilities.away

  while (total !== 100) {
    const direction = total > 100 ? -1 : 1
    const candidates = keys
      .filter((key) => (
        direction === -1
          ? probabilities[key] > ranges[key].min
          : probabilities[key] < ranges[key].max
      ))
      .sort((left, right) => (
        direction === -1
          ? probabilities[right] - probabilities[left]
          : probabilities[left] - probabilities[right]
      ))

    const candidate = candidates[0]

    if (!candidate) {
      break
    }

    probabilities[candidate] += direction
    total += direction
  }

  probabilities.away = 100 - probabilities.home - probabilities.draw
  return probabilities
}

function summarizePrediction(match: MatchPredictionRequest['match'], probabilities: MatchPrediction['probabilities']) {
  const ordered = [
    { key: 'home', value: probabilities.home, label: match.home.name },
    { key: 'draw', value: probabilities.draw, label: '平局' },
    { key: 'away', value: probabilities.away, label: match.away.name },
  ].sort((left, right) => right.value - left.value)

  const winner = ordered[0]

  if (winner.key === 'draw') {
    return `${match.home.name} 与 ${match.away.name} 更可能在常规时间形成胶着局面。`
  }

  return `${winner.label} 更被看好在常规时间掌握这场比赛的主动权。`
}

function getConfidence(probabilities: MatchPrediction['probabilities']) {
  const ordered = [probabilities.home, probabilities.draw, probabilities.away].sort((left, right) => right - left)
  const [best, second] = ordered
  const margin = best - second

  if (best >= 56 || margin >= 16) {
    return '高'
  }

  if (best >= 46 || margin >= 9) {
    return '中'
  }

  return '谨慎'
}

function findScheduledMatch(content: WorldCupContent, matchKey: string) {
  for (const day of content.schedule.days) {
    for (const match of day.matches) {
      if (createMatchPredictionKey(day, match) === matchKey) {
        return {
          day: {
            day: day.day,
            month: day.month,
            weekday: day.weekday,
          },
          match: {
            time: match.time,
            group: match.group,
            venue: [...match.venue],
            home: {
              flagCode: match.home.flagCode,
              name: match.home.name,
            },
            away: {
              flagCode: match.away.flagCode,
              name: match.away.name,
            },
          } satisfies MatchPredictionRequest['match'],
        }
      }
    }
  }

  return null
}

export function createMatchPredictionContext(
  request: MatchPredictionRequest,
  content: WorldCupContent | null,
): MatchPredictionContext {
  const basisContent = content ?? fallbackContent
  const canonical = findScheduledMatch(basisContent, request.matchKey)

  return {
    matchKey: request.matchKey,
    day: canonical?.day ?? request.day,
    match: canonical?.match ?? request.match,
    basisUpdatedAt: basisContent.meta.updatedAt,
    content: basisContent,
  }
}

export function getMatchPredictionSignals(context: MatchPredictionContext): MatchPredictionSignals {
  const home = resolveTeamProfile(context.match.home, context.content)
  const away = resolveTeamProfile(context.match.away, context.content)
  const hostCountry = inferHostCountry(context.match)
  const homeHostAdvantage = hostCountry !== null && hostCountry === home.flagCode
  const awayHostAdvantage = hostCountry !== null && hostCountry === away.flagCode
  const homeRating = home.strength + (home.champion ? 2 : 0) + (home.debut ? -3 : 0) + (homeHostAdvantage ? 3 : 0)
  const awayRating = away.strength + (away.champion ? 2 : 0) + (away.debut ? -3 : 0) + (awayHostAdvantage ? 3 : 0)

  return {
    homeRating,
    awayRating,
    groupStage: context.match.group.includes('组'),
    sameTier: Math.abs(home.strength - away.strength) <= 4,
    hostCountry,
    homeHostAdvantage,
    awayHostAdvantage,
    homeChampion: home.champion,
    awayChampion: away.champion,
    homeDebut: home.debut,
    awayDebut: away.debut,
  }
}

export function buildOverallPredictions(content: WorldCupContent, generatedAt: string): OverallPredictionSummary {
  const dayBias = new Date(generatedAt).getUTCDate() % 4
  const favorites: PredictionFavorite[] = seededTeams
    .map((team, index) => {
      const probability = clamp(team.probability + ((dayBias + index) % 3) - 1, 8, 22)

      return {
        rank: String(index + 1).padStart(2, '0'),
        team: findTeam(content, team.name),
        probability,
        insight: team.insight,
      }
    })
    .sort((left, right) => right.probability - left.probability)
    .map((favorite, index) => ({
      ...favorite,
      rank: String(index + 1).padStart(2, '0'),
    }))

  return {
    generatedAt,
    basisUpdatedAt: content.meta.updatedAt,
    status: 'ready',
    disclaimer: 'AI 概率基于当前分组、赛程与历史强度的摘要推断，每日随内容快照更新。',
    favorites,
  }
}

export function buildMatchPrediction(context: MatchPredictionContext): MatchPrediction {
  const home = resolveTeamProfile(context.match.home, context.content)
  const away = resolveTeamProfile(context.match.away, context.content)
  const signals = getMatchPredictionSignals(context)
  const ratingGap = signals.homeRating - signals.awayRating
  const absoluteGap = Math.abs(ratingGap)
  let draw = signals.groupStage ? 28 : 24

  if (signals.sameTier) {
    draw += 5
  } else if (absoluteGap <= 9) {
    draw += 2
  } else if (absoluteGap >= 18) {
    draw -= 5
  } else if (absoluteGap >= 12) {
    draw -= 2
  }

  draw = clamp(draw, signals.groupStage ? 16 : 12, 34)

  const nonDraw = 100 - draw
  const homeShare = clamp(0.5 + (ratingGap / 100), 0.18, 0.82)
  const homeWin = nonDraw * homeShare
  const awayWin = nonDraw - homeWin
  const probabilities = normalizeProbabilities(homeWin, draw, awayWin)
  const generatedAt = new Date().toISOString()

  return {
    matchKey: context.matchKey,
    summary: summarizePrediction(context.match, probabilities),
    confidence: getConfidence(probabilities),
    probabilities,
    reasoning: createReasoning(home, away, context.match, signals),
    basisUpdatedAt: context.basisUpdatedAt,
    modelVersion: MATCH_PREDICTION_MODEL_VERSION,
    generatedAt,
    status: 'ready',
  }
}
