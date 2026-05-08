import { MultilineText } from './MultilineText'
import type { WorldCupContent } from '../types/content'

interface ScheduleSectionProps {
  schedule: WorldCupContent['schedule']
}

export function ScheduleSection({ schedule }: ScheduleSectionProps) {
  return (
    <>
      <div className="sec-header">
        <div className="sec-header-label">02</div>
        <div className="sec-header-title">小组赛赛程</div>
        <div className="sec-header-count">GROUP STAGE · JUN 11–27</div>
      </div>
      <div className="sched-wrap">
        {schedule.days.map((day) => (
          <div key={`${day.month}-${day.day}-${day.weekday}`} className="sched-day">
            <div className="sched-day-head">
              <div className="sday-num">{day.day}</div>
              <div className="sday-month">{day.month} · {day.weekday}</div>
              {day.badge && <div className="sday-badge">{day.badge}</div>}
              <div className="sday-line"></div>
            </div>
            {day.matches.map((match) => (
              <div key={`${day.day}-${match.time}-${match.home.name}-${match.away.name}`} className="match-row">
                <div className="mr-time">{match.time}</div>
                <div className="mr-home"><span className="mr-team-flag">{match.home.flag}</span><span className="mr-team-name">{match.home.name}</span></div>
                <div className="mr-vs">VS</div>
                <div className="mr-away"><span className="mr-team-flag">{match.away.flag}</span><span className="mr-team-name">{match.away.name}</span></div>
                <div className="mr-info">
                  <div className="mr-group">{match.group}</div>
                  <MultilineText className="mr-venue" lines={match.venue} />
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="schedule-note">{schedule.note}</div>
      </div>
    </>
  )
}
