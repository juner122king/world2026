import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { WorldCupContent } from '@world2026/content-contract'

let cachedFallbackContent: WorldCupContent | null = null

function loadFallbackContent(): WorldCupContent {
  if (cachedFallbackContent) {
    return cachedFallbackContent
  }

  try {
    const fallbackPath = join(process.cwd(), 'public-data', 'data', 'worldcup2026.json')
    const content = JSON.parse(readFileSync(fallbackPath, 'utf8')) as WorldCupContent
    cachedFallbackContent = content
    return content
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.warn(`Failed to load fallback content from public-data: ${message}`)

    // Return a minimal valid fallback to prevent complete failure
    return {
      meta: {
        title: 'FIFA WC 2026™',
        updatedAt: new Date().toISOString(),
        sources: ['fallback'],
      },
      ticker: ['FIFA WORLD CUP 2026', '48支球队', '104场比赛'],
      hero: {
        eyebrow: 'FIFA 世界杯 · 北美洲 · 第 23 届',
        title: { main: ['WORLD', 'CUP'], year: '2026' },
        badges: [
          { text: '⚽ 6.11 — 7.19', highlighted: true },
          { text: '🇺🇸 美国' },
          { text: '🇨🇦 加拿大' },
          { text: '🇲🇽 墨西哥' },
        ],
        countdownLabel: '距开幕',
        countdownSubtext: ['2026年6月11日', '墨西哥 vs 南非', '墨西哥城体育场'],
        openingDate: '2026-06-11T21:00:00Z',
      },
      groups: [],
      schedule: {
        note: '赛程数据暂时无法加载',
        days: [],
      },
      knockout: {
        stages: [],
        final: {
          venue: { eyebrow: '决赛场地', title: ['纽约', '新泽西'], detail: ['MetLife Stadium', '东卢瑟福，新泽西州'] },
          center: { trophy: '🏆', title: ['FINAL', '2026'], date: '7月19日 · 04:00 GMT' },
          format: { eyebrow: '赛制特点', title: ['双赛路径', '设计'], detail: [] },
        },
      },
      overview: {
        stats: [
          { value: '48', label: '参赛队伍' },
          { value: '104', label: '比赛场次' },
        ],
        hosts: [],
        favoritesTitle: '夺冠热门排行',
        favorites: [],
      },
      predictions: {
        overall: undefined,
      },
    }
  }
}

export function getFallbackContent(): WorldCupContent {
  return loadFallbackContent()
}

export const fallbackContent = new Proxy({} as WorldCupContent, {
  get() {
    return loadFallbackContent()
  },
})
