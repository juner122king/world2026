import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildMatchPrediction } from '../../server/content/predictions.js'
import { readMatchPrediction, writeMatchPrediction } from '../../server/content/storage.js'
import type { MatchPredictionRequest } from '../../src/lib/predictions.js'

function isPredictionRequest(value: unknown): value is MatchPredictionRequest {
  if (!value || typeof value !== 'object') {
    return false
  }

  const request = value as Record<string, unknown>
  const match = request.match as Record<string, unknown> | undefined
  const day = request.day as Record<string, unknown> | undefined

  return typeof request.matchKey === 'string'
    && Boolean(match)
    && typeof match?.time === 'string'
    && typeof match?.group === 'string'
    && Array.isArray(match?.venue)
    && typeof (match?.home as Record<string, unknown> | undefined)?.name === 'string'
    && typeof (match?.away as Record<string, unknown> | undefined)?.name === 'string'
    && Boolean(day)
    && typeof day?.day === 'string'
    && typeof day?.month === 'string'
    && typeof day?.weekday === 'string'
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isPredictionRequest(request.body)) {
    response.status(400).json({ error: 'Invalid prediction request payload' })
    return
  }

  try {
    const cachedPrediction = await readMatchPrediction(request.body.matchKey)

    if (cachedPrediction) {
      response.status(200).json({
        ...cachedPrediction,
        status: 'cached',
      })
      return
    }

    const prediction = buildMatchPrediction(request.body)
    await writeMatchPrediction(prediction)

    response.status(200).json(prediction)
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate match prediction',
    })
  }
}
