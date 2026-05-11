import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { WorldCupContent } from '../../src/types/content.js'

export const fallbackContent = JSON.parse(
  readFileSync(join(process.cwd(), 'public', 'data', 'worldcup2026.json'), 'utf8'),
) as WorldCupContent
