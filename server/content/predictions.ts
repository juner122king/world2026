import type {
  MatchPrediction,
  OverallPredictionSummary,
  PredictionFavorite,
  PredictionTeamRef,
  WorldCupContent,
} from '../../src/types/content.js'
import type { MatchPredictionRequest } from '../../src/lib/predictions.js'

const seededTeams: Array<{ name: string; probability: number; insight: string }> = [
  { name: '西班牙', probability: 18, insight: '签位稳定，技术体系成熟，淘汰赛上限仍然最高。' },
  { name: '英格兰', probability: 16, insight: '阵容深度充足，边路推进和定位球仍是核心优势。' },
  { name: '法国', probability: 15, insight: '关键点在于中前场转换效率与防线健康度。' },
  { name: '巴西', probability: 14, insight: '上限取决于前场个人能力能否持续兑现。' },
  { name: '阿根廷', probability: 13, insight: '卫冕经验让比赛管理能力依旧突出。' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hashString(input: string) {
  let hash = 0

  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000
  }

  return hash
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

export function buildMatchPrediction(request: MatchPredictionRequest): MatchPrediction {
  const hash = hashString(request.matchKey)
  const homeEdge = hash % 19
  const awayEdge = (hash >> 1) % 17
  const home = clamp(42 + homeEdge - awayEdge, 18, 68)
  const away = clamp(30 + awayEdge - Math.floor(homeEdge / 2), 14, 60)
  const draw = clamp(100 - home - away, 12, 34)
  const probabilities = {
    home,
    draw,
    away: 100 - home - draw,
  }
  const sorted = [
    { key: 'home', value: probabilities.home, name: request.match.home.name },
    { key: 'draw', value: probabilities.draw, name: '平局' },
    { key: 'away', value: probabilities.away, name: request.match.away.name },
  ].sort((left, right) => right.value - left.value)
  const winner = sorted[0]
  const generatedAt = new Date().toISOString()

  return {
    matchKey: request.matchKey,
    summary:
      winner.key === 'draw'
        ? `${request.match.home.name} 与 ${request.match.away.name} 更可能进入胶着局面。`
        : `${winner.name} 更被看好拿到这场比赛的主动权。`,
    confidence: winner.value >= 50 ? '高' : winner.value >= 40 ? '中' : '谨慎',
    probabilities,
    reasoning: [
      `${request.match.group} 的对阵节奏预计会偏谨慎，首发阶段不会过早压上。`,
      `${request.match.venue[0]} 的比赛环境更利于防线稳定的一方控制节奏。`,
      `${request.match.home.name} 与 ${request.match.away.name} 的预测结果会随每日快照更新背景判断，但单场生成后保持缓存。`,
    ],
    generatedAt,
    status: 'ready',
  }
}
