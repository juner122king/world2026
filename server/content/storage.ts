import {
  WORLD_CUP_CONTENT_KEY,
  WORLD_CUP_MATCH_PREDICTION_KEY_PREFIX,
  WORLD_CUP_SYNC_STATUS_KEY,
} from './constants.js'
import type { MatchPrediction, WorldCupContent } from '../../src/types/content.js'

export interface SyncStatus {
  ok: boolean
  syncedAt: string
  message: string
}

export function hasSnapshotStorage() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

let kvPromise: Promise<Awaited<ReturnType<typeof createKv>>> | null = null

async function createKv() {
  const { Redis } = await import('@upstash/redis')

  return new Redis({
    url: process.env.KV_REST_API_URL as string,
    token: process.env.KV_REST_API_TOKEN as string,
  })
}

async function getKv() {
  if (!hasSnapshotStorage()) {
    return null
  }

  kvPromise ??= createKv()
  return kvPromise
}

export async function readContentSnapshot(): Promise<WorldCupContent | null> {
  const kv = await getKv()

  if (!kv) {
    return null
  }

  return kv.get<WorldCupContent>(WORLD_CUP_CONTENT_KEY)
}

export async function writeContentSnapshot(content: WorldCupContent) {
  const kv = await getKv()

  if (!kv) {
    return
  }

  await kv.set(WORLD_CUP_CONTENT_KEY, content)
}

export async function writeSyncStatus(status: SyncStatus) {
  const kv = await getKv()

  if (!kv) {
    return
  }

  await kv.set(WORLD_CUP_SYNC_STATUS_KEY, status)
}

export async function readMatchPrediction(matchKey: string): Promise<MatchPrediction | null> {
  const kv = await getKv()

  if (!kv) {
    return null
  }

  return kv.get<MatchPrediction>(`${WORLD_CUP_MATCH_PREDICTION_KEY_PREFIX}${matchKey}`)
}

export async function writeMatchPrediction(prediction: MatchPrediction) {
  const kv = await getKv()

  if (!kv) {
    return
  }

  await kv.set(`${WORLD_CUP_MATCH_PREDICTION_KEY_PREFIX}${prediction.matchKey}`, prediction)
}
