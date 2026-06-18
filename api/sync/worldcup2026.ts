import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasCoreContentData } from '../../server/content/contentHealth.js'
import { CHINA_TIME_ZONE } from '../../server/content/constants.js'
import { fetchProviderPayload, mapProviderPayloadToContent } from '../../server/content/provider.js'
import { buildOverallPredictions } from '../../server/content/predictions.js'
import { hasSnapshotStorage, readContentSnapshot, writeContentSnapshot, writeSyncStatus } from '../../server/content/storage.js'

const SKIP_WINDOW_MINUTES = 60

function getBearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
}

function parseMatchTime(matchTime: string, matchDay: string, matchMonth: string): Date | null {
  const monthMap: Record<string, number> = { '六月': 6, '七月': 7 }
  const month = monthMap[matchMonth]
  if (!month || !matchDay || !matchTime) return null

  const [hour, minute] = matchTime.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null

  const now = new Date()
  const year = now.getFullYear()
  const date = new Date(year, month - 1, Number(matchDay), hour, minute)
  return date
}

async function shouldSkipSync(): Promise<boolean> {
  const snapshot = await readContentSnapshot()
  if (!snapshot?.schedule?.days) return false

  const now = new Date()
  const windowEnd = new Date(now.getTime() + SKIP_WINDOW_MINUTES * 60 * 1000)

  for (const day of snapshot.schedule.days) {
    for (const match of day.matches) {
      if (match.status === 'live') return false

      if (match.status === 'scheduled') {
        const matchTime = parseMatchTime(match.time, day.day, day.month)
        if (matchTime && matchTime <= windowEnd) return false
      }
    }
  }

  return true
}

function isAuthorized(request: VercelRequest) {
  const cronSecret = process.env.CRON_SECRET
  const syncSecret = process.env.SYNC_SECRET

  if (!cronSecret && !syncSecret) {
    return false
  }

  const authorizationSecret = getBearerToken(request.headers.authorization)
  const headerSecret = typeof request.headers['x-sync-secret'] === 'string' ? request.headers['x-sync-secret'] : undefined
  const querySecret = typeof request.query.secret === 'string' ? request.query.secret : undefined

  if (cronSecret && authorizationSecret === cronSecret) {
    return true
  }

  return Boolean(
    syncSecret
      && (authorizationSecret === syncSecret || headerSecret === syncSecret || querySecret === syncSecret),
  )
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  const syncedAt = new Date().toISOString()
  const force = request.query.force === 'true'

  try {
    if (!hasSnapshotStorage()) {
      throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are required for sync')
    }

    if (!force && await shouldSkipSync()) {
      response.status(200).json({ ok: true, skipped: true, syncedAt, message: 'No live or upcoming matches' })
      return
    }

    const payload = await fetchProviderPayload()
    const content = mapProviderPayloadToContent(payload, syncedAt)

    if (!hasCoreContentData(content)) {
      throw new Error('Football API returned incomplete content: empty schedule or standings')
    }

    const nextContent = {
      ...content,
      predictions: {
        ...content.predictions,
        overall: buildOverallPredictions(content, syncedAt),
      },
    }

    await Promise.all([
      writeContentSnapshot(nextContent),
      writeSyncStatus({
        ok: true,
        syncedAt,
        message: 'World Cup content synced successfully',
      }),
    ])

    response.status(200).json({
      ok: true,
      syncedAt,
      matches: nextContent.schedule.days.reduce((total, day) => total + day.matches.length, 0),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'World Cup content sync failed'

    await writeSyncStatus({
      ok: false,
      syncedAt,
      message,
    })

    response.status(500).json({
      ok: false,
      syncedAt,
      error: message,
    })
  }
}
