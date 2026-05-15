import type { PredictionTeamRef, ScheduleDay, ScheduleMatch } from '../types/content'

export function createMatchPredictionKey(day: Pick<ScheduleDay, 'day' | 'month'>, match: Pick<ScheduleMatch, 'time' | 'home' | 'away'>) {
  return [day.month, day.day, match.time, match.home.name, match.away.name]
    .map((part) => part.trim().toLowerCase())
    .join('__')
}

export interface MatchPredictionRequest {
  matchKey: string
  day: Pick<ScheduleDay, 'day' | 'month' | 'weekday'>
  match: Pick<ScheduleMatch, 'time' | 'group' | 'venue'> & {
    home: PredictionTeamRef
    away: PredictionTeamRef
  }
}

export function createMatchPredictionRequest(day: ScheduleDay, match: ScheduleMatch): MatchPredictionRequest {
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
