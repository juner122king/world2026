import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fallbackContent } from '../../server/content/fallbackContent.js'
import { readContentSnapshot } from '../../server/content/storage.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const snapshot = await readContentSnapshot()
    const content = snapshot ?? fallbackContent

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    response.status(200).json(content)
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load World Cup content',
    })
  }
}
