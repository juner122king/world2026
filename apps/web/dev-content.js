import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { asArray, buildScheduleDays, buildGroupStandings } from '../../server/content/transform.js'

const fallbackContentPath = fileURLToPath(new URL('../../public-data/data/worldcup2026.json', import.meta.url))

function loadFallbackContent() {
  return readFile(fallbackContentPath, 'utf8').then((content) => JSON.parse(content))
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
  const fallbackGroups = Array.isArray(fallbackContent.groups) ? fallbackContent.groups : []
  const groups = buildGroupStandings(fallbackGroups, fixtures)

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
