import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasCoreContentData } from '../../server/content/contentHealth.js'
import { CHINA_TIME_ZONE } from '../../server/content/constants.js'
import { fetchProviderPayload, mapProviderPayloadToContent } from '../../server/content/provider.js'
import { buildOverallPredictions } from '../../server/content/predictions.js'
import { hasSnapshotStorage, writeContentSnapshot, writeSyncStatus } from '../../server/content/storage.js'

// World Cup 2026: June 11 – July 19
// Kickoff hours (Beijing time): 00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12
// Matches span from 00:00 to ~14:00 Beijing time, then quiet until next day
const TOURNAMENT_START = new Date('2026-06-11T00:00:00+08:00')
const TOURNAMENT_END = new Date('2026-07-20T00:00:00+08:00')
const MATCH_WINDOW_START = 0  // Beijing hour
const MATCH_WINDOW_END = 15   // Beijing hour (12:00 kickoff + ~2h match + buffer)

function getBearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
}

function getBeijingHour(): number {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: CHINA_TIME_ZONE,
    hour: '2-digit',
    hour12: false,
  }).format(new Date()))
}

function isDuringTournament(): boolean {
  const now = new Date()
  return now >= TOURNAMENT_START && now < TOURNAMENT_END
}

function isInMatchWindow(): boolean {
  const hour = getBeijingHour()
  return hour >= MATCH_WINDOW_START && hour < MATCH_WINDOW_END
}

function shouldSkipSync(): boolean {
  if (!isDuringTournament()) return true
  return !isInMatchWindow()
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

    if (!force && shouldSkipSync()) {
      response.status(200).json({ ok: true, skipped: true, syncedAt, message: 'Outside match window, skipping sync' })
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
