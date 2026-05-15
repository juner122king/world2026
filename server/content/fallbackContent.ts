import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { WorldCupContent } from '@world2026/content-contract'

export const fallbackContent = JSON.parse(
  readFileSync(join(process.cwd(), 'public-data', 'data', 'worldcup2026.json'), 'utf8'),
) as WorldCupContent
