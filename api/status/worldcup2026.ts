import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasSnapshotStorage, readContentSnapshot, readSyncStatus } from '../../server/content/storage.js'

function countMatches(snapshot: Awaited<ReturnType<typeof readContentSnapshot>>) {
  return snapshot?.schedule.days.reduce((total, day) => total + day.matches.length, 0) ?? 0
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const [snapshot, syncStatus] = await Promise.all([
      readContentSnapshot(),
      readSyncStatus(),
    ])

    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120')
    response.status(200).json({
      ok: syncStatus?.ok ?? false,
      storageConfigured: hasSnapshotStorage(),
      hasSnapshot: Boolean(snapshot),
      syncedAt: syncStatus?.syncedAt ?? null,
      message: syncStatus?.message ?? 'No sync status recorded',
      provider: process.env.FOOTBALL_API_PROVIDER ?? 'wc2026api',
      snapshotUpdatedAt: snapshot?.meta.updatedAt ?? null,
      source: snapshot?.meta.sources[0] ?? null,
      days: snapshot?.schedule.days.length ?? 0,
      matches: countMatches(snapshot),
    })
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load World Cup sync status',
    })
  }
}
