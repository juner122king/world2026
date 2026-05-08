import type { Group } from '../types/content'

interface GroupsSectionProps {
  groups: Group[]
}

export function GroupsSection({ groups }: GroupsSectionProps) {
  return (
    <>
      <div className="sec-header">
        <div className="sec-header-label">01</div>
        <div className="sec-header-title">小组赛分组</div>
        <div className="sec-header-count">{groups.length} GROUPS · {groups.length * 4} TEAMS</div>
      </div>
      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group.letter} className="group-cell">
            <div className="gc-letter">{group.letter}</div>
            <div className="gc-head">
              <div className="gc-letter-badge">GRP {group.letter}</div>
              <div className="gc-group-label">{group.label}</div>
            </div>
            <div className="gc-teams">
              {group.teams.map((team) => (
                <div key={`${group.letter}-${team.name}`} className="gc-team">
                  <span className="gc-flag">{team.flag}</span>
                  <span className="gc-name">{team.name}{team.champion ? ' 🏆' : ''}</span>
                  {team.debut && <span className="gc-debut">首秀</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
