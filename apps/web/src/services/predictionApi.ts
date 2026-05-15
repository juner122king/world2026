import type { MatchPrediction, MatchPredictionRequest } from '@world2026/content-contract'

const matchPredictionUrl = '/api/predictions/match'

export async function fetchMatchPrediction(
  request: MatchPredictionRequest,
  signal?: AbortSignal,
): Promise<MatchPrediction> {
  const response = await fetch(matchPredictionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    throw new Error(`预测生成失败：${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<MatchPrediction>
}
