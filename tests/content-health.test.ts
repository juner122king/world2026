import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackContent } from '../server/content/fallbackContent.js'
import { hasCoreContentData } from '../server/content/contentHealth.js'

test('fallback content has core match and standings data', () => {
  assert.equal(hasCoreContentData(fallbackContent), true)
})

test('content missing schedule or standings is rejected', () => {
  const brokenContent = {
    ...fallbackContent,
    schedule: {
      ...fallbackContent.schedule,
      days: [],
    },
    groups: fallbackContent.groups.map((group, index) => (
      index === 0 ? { ...group, standings: [] } : group
    )),
  }

  assert.equal(hasCoreContentData(brokenContent), false)
})
