import assert from 'node:assert/strict'
import test from 'node:test'
import type { MatchPredictionRequest, ScheduleDay, ScheduleMatch } from '@world2026/content-contract'
import { shouldUseCachedPrediction } from '../api/predictions/match.js'
import {
  buildMatchPrediction,
  createMatchPredictionContext,
  getMatchPredictionSignals,
} from '../server/content/predictions.js'
import { fallbackContent } from '../server/content/fallbackContent.js'

function createMatchPredictionKey(day: Pick<ScheduleDay, 'day' | 'month'>, match: Pick<ScheduleMatch, 'time' | 'home' | 'away'>) {
  return [day.month, day.day, match.time, match.home.name, match.away.name]
    .map((part) => part.trim().toLowerCase())
    .join('__')
}

function createRequest(day: ScheduleDay, match: ScheduleMatch): MatchPredictionRequest {
  return {
    matchKey: createMatchPredictionKey(day, match),
    day: {
      day: day.day,
      month: day.month,
      weekday: day.weekday,
    },
    match: {
      time: match.time,
      group: match.group,
      venue: [...match.venue],
      home: {
        flagCode: match.home.flagCode,
        name: match.home.name,
      },
      away: {
        flagCode: match.away.flagCode,
        name: match.away.name,
      },
    },
  }
}

function findScheduledRequest(homeName: string, awayName: string) {
  for (const day of fallbackContent.schedule.days) {
    const match = day.matches.find((candidate) => candidate.home.name === homeName && candidate.away.name === awayName)

    if (match) {
      return createRequest(day, match)
    }
  }

  throw new Error(`Unable to find scheduled match for ${homeName} vs ${awayName}`)
}

test('favored teams keep the highest win probability in clear mismatch spots', () => {
  const request = findScheduledRequest('西班牙', '佛得角')
  const prediction = buildMatchPrediction(createMatchPredictionContext(request, fallbackContent))

  assert.equal(prediction.modelVersion, 'heuristic-v1')
  assert.equal(prediction.basisUpdatedAt, fallbackContent.meta.updatedAt)
  assert.equal(prediction.status, 'ready')
  assert.ok(prediction.probabilities.home > prediction.probabilities.draw)
  assert.ok(prediction.probabilities.home > prediction.probabilities.away)
})

test('same-tier matches keep a higher draw probability than lopsided fixtures', () => {
  const balanced = buildMatchPrediction(createMatchPredictionContext(findScheduledRequest('韩国', '捷克'), fallbackContent))
  const mismatch = buildMatchPrediction(createMatchPredictionContext(findScheduledRequest('西班牙', '佛得角'), fallbackContent))

  assert.ok(balanced.probabilities.draw > mismatch.probabilities.draw)
})

test('champion, debut, and host-country signals are reflected in the derived ratings', () => {
  const tagHeavyContext = createMatchPredictionContext(
    {
      matchKey: 'custom__argentina__jordan',
      day: {
        day: '20',
        month: '六月',
        weekday: '周六',
      },
      match: {
        time: '20:00',
        group: 'J组',
        venue: ['纽约新泽西体育场', '新泽西，美国'],
        home: {
          flagCode: 'ar',
          name: '阿根廷',
        },
        away: {
          flagCode: 'jo',
          name: '约旦',
        },
      },
    },
    fallbackContent,
  )
  const neutralHostContext = createMatchPredictionContext(
    {
      matchKey: 'custom__mexico__neutral',
      day: {
        day: '21',
        month: '六月',
        weekday: '周日',
      },
      match: {
        time: '18:00',
        group: 'A组',
        venue: ['休斯顿体育场', '休斯顿，美国'],
        home: {
          flagCode: 'mx',
          name: '墨西哥',
        },
        away: {
          flagCode: 'za',
          name: '南非',
        },
      },
    },
    fallbackContent,
  )
  const hostBoostContext = createMatchPredictionContext(
    {
      matchKey: 'custom__mexico__host',
      day: {
        day: '21',
        month: '六月',
        weekday: '周日',
      },
      match: {
        time: '18:00',
        group: 'A组',
        venue: ['墨西哥城体育场', '墨西哥城，墨西哥'],
        home: {
          flagCode: 'mx',
          name: '墨西哥',
        },
        away: {
          flagCode: 'za',
          name: '南非',
        },
      },
    },
    fallbackContent,
  )

  const tagSignals = getMatchPredictionSignals(tagHeavyContext)
  const neutralHostSignals = getMatchPredictionSignals(neutralHostContext)
  const hostBoostSignals = getMatchPredictionSignals(hostBoostContext)

  assert.equal(tagSignals.homeChampion, true)
  assert.equal(tagSignals.awayDebut, true)
  assert.ok(tagSignals.homeRating > tagSignals.awayRating)
  assert.equal(hostBoostSignals.homeHostAdvantage, true)
  assert.ok(hostBoostSignals.homeRating > neutralHostSignals.homeRating)
})

test('probabilities stay integral and always add up to 100', () => {
  const prediction = buildMatchPrediction(createMatchPredictionContext(findScheduledRequest('英格兰', '克罗地亚'), fallbackContent))

  assert.equal(Number.isInteger(prediction.probabilities.home), true)
  assert.equal(Number.isInteger(prediction.probabilities.draw), true)
  assert.equal(Number.isInteger(prediction.probabilities.away), true)
  assert.equal(
    prediction.probabilities.home + prediction.probabilities.draw + prediction.probabilities.away,
    100,
  )
})

test('predictions remain stable for the same input and basis snapshot', () => {
  const context = createMatchPredictionContext(findScheduledRequest('法国', '塞内加尔'), fallbackContent)
  const first = buildMatchPrediction(context)
  const second = buildMatchPrediction(context)

  assert.equal(first.summary, second.summary)
  assert.equal(first.confidence, second.confidence)
  assert.deepEqual(first.probabilities, second.probabilities)
  assert.deepEqual(first.reasoning, second.reasoning)
  assert.equal(first.basisUpdatedAt, second.basisUpdatedAt)
  assert.equal(first.modelVersion, second.modelVersion)
})

test('predictions still build when no snapshot storage is available', () => {
  const request = findScheduledRequest('葡萄牙', '刚果(金)')
  const prediction = buildMatchPrediction(createMatchPredictionContext(request, null))

  assert.equal(prediction.status, 'ready')
  assert.equal(prediction.basisUpdatedAt, fallbackContent.meta.updatedAt)
})

test('cached predictions are reused only when the basis snapshot matches', () => {
  const request = findScheduledRequest('阿根廷', '阿尔及利亚')
  const prediction = buildMatchPrediction(createMatchPredictionContext(request, fallbackContent))

  assert.equal(shouldUseCachedPrediction(prediction, prediction.basisUpdatedAt), true)
  assert.equal(shouldUseCachedPrediction(prediction, '2026-06-01T00:00:00.000Z'), false)
  assert.equal(shouldUseCachedPrediction(null, prediction.basisUpdatedAt), false)
})
