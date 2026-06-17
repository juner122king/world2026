import assert from 'node:assert/strict'
import test from 'node:test'
import { mapProviderPayloadToContent } from '../server/content/provider.js'

test('provider payload maps standings and finished scores into content', () => {
  const content = mapProviderPayloadToContent(
    {
      fixtures: [
        {
          fixture: {
            date: '2026-06-11T07:00:00.000Z',
            venue: {
              name: '墨西哥城体育场',
              city: '墨西哥城，墨西哥',
            },
            status: {
              short: 'FT',
              long: 'Match Finished',
            },
          },
          teams: {
            home: { name: 'Mexico', code: 'MEX' },
            away: { name: 'South Africa', code: 'RSA' },
          },
          goals: {
            home: 2,
            away: 1,
          },
          group_name: 'A',
        },
      ],
      standings: [
        {
          league: {
            group: 'Group A',
            standings: [[
              {
                rank: 1,
                team: { name: 'Mexico', code: 'MEX' },
                points: 3,
                goalsDiff: 1,
                all: {
                  played: 1,
                  win: 1,
                  draw: 0,
                  lose: 0,
                  goals: {
                    for: 2,
                    against: 1,
                  },
                },
              },
              {
                rank: 4,
                team: { name: 'South Africa', code: 'RSA' },
                points: 0,
                goalsDiff: -1,
                all: {
                  played: 1,
                  win: 0,
                  draw: 0,
                  lose: 1,
                  goals: {
                    for: 1,
                    against: 2,
                  },
                },
              },
            ]],
          },
        },
      ],
      teams: [],
      venues: [],
    },
    '2026-06-17T00:00:00.000Z',
  )

  const groupA = content.groups.find((group) => group.letter === 'A')
  const firstDay = content.schedule.days[0]
  const firstMatch = firstDay.matches[0]

  assert.ok(groupA?.standings)
  assert.equal(groupA?.standings?.[0].team.name, '墨西哥')
  assert.equal(groupA?.standings?.[0].points, 3)
  assert.equal(groupA?.standings?.[1].goalDifference, -1)
  assert.equal(firstMatch.group, 'A组')
  assert.equal(firstMatch.status, 'finished')
  assert.deepEqual(firstMatch.score, { home: 2, away: 1 })
  assert.equal(firstMatch.statusLabel, 'Match Finished')
})
