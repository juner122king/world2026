import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getFallbackContent } from '../../server/content/fallbackContent.js'
import { readContentSnapshot } from '../../server/content/storage.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    let content
    try {
      const snapshot = await readContentSnapshot()
      content = snapshot ?? getFallbackContent()
    } catch (snapshotError) {
      const message = snapshotError instanceof Error ? snapshotError.message : 'Unknown error reading snapshot'
      console.warn(`Failed to read content snapshot: ${message}, using fallback content`)
      content = getFallbackContent()
    }

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    response.status(200).json(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load World Cup content'
    console.error(`Content API error: ${message}`)
    response.status(500).json({
      error: message,
    })
  }
}
