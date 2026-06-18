import type { Group } from '@world2026/content-contract'
import { CountryFlag } from './CountryFlag'

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
            <div className="gc-standings">
              <div className="gc-standings-head">
                <span>球队</span>
                <span>排名</span>
                <span>场</span>
                <span>胜</span>
                <span>平</span>
                <span>负</span>
                <span>进/失</span>
                <span>净</span>
                <span>分</span>
              </div>
              <div className="gc-standings-body">
                {group.teams.map((team, index) => {
                  const standing = group.standings?.find((entry) => entry.team.name === team.name)

                  return (
                    <div key={`${group.letter}-team-${team.name}`} className="gc-standings-row">
                      <div className="gc-standings-team">
                        <CountryFlag code={team.flagCode} label={team.name} className="gc-flag" />
                        <span className="gc-name">
                          <span className="gc-name-text">{team.name}</span>
                          {team.champion && <span className="gc-tag gc-tag-champion">冠军</span>}
                        </span>
                      </div>
                      <span className="gc-standings-rank">{standing?.rank ?? index + 1}</span>
                      <span>{standing?.played ?? '-'}</span>
                      <span>{standing?.won ?? '-'}</span>
                      <span>{standing?.draw ?? '-'}</span>
                      <span>{standing?.lost ?? '-'}</span>
                      <span>{standing ? `${standing.goalsFor}/${standing.goalsAgainst}` : '-'}</span>
                      <span>{standing ? (standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference) : '-'}</span>
                      <span className="gc-standings-points">{standing?.points ?? '-'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
