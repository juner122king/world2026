import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasCoreContentData } from '../../server/content/contentHealth.js'
import { fetchProviderPayload, mapProviderPayloadToContent } from '../../server/content/provider.js'
import { buildOverallPredictions } from '../../server/content/predictions.js'
import { hasSnapshotStorage, writeContentSnapshot, writeSyncStatus } from '../../server/content/storage.js'

function getBearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
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

  try {
    if (!hasSnapshotStorage()) {
      throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are required for sync')
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
