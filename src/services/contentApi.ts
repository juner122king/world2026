import type { WorldCupContent } from '../types/content'

const contentUrl = `${import.meta.env.BASE_URL}data/worldcup2026.json`

export async function fetchWorldCupContent(signal?: AbortSignal): Promise<WorldCupContent> {
  const response = await fetch(contentUrl, { signal })

  if (!response.ok) {
    throw new Error(`内容加载失败：${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<WorldCupContent>
}
