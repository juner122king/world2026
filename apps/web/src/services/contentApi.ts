import type { WorldCupContent } from '@world2026/content-contract'

const fallbackContentUrl = `${import.meta.env.BASE_URL}data/worldcup2026.json`
const contentUrl = import.meta.env.VITE_CONTENT_API_URL || '/api/content/worldcup2026'

async function fetchJsonContent(url: string, signal?: AbortSignal): Promise<WorldCupContent> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`内容加载失败：${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<WorldCupContent>
}

export async function fetchWorldCupContent(signal?: AbortSignal): Promise<WorldCupContent> {
  try {
    return await fetchJsonContent(contentUrl, signal)
  } catch {
    return fetchJsonContent(fallbackContentUrl, signal)
  }
}
