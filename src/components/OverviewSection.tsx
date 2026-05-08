import { MultilineText } from './MultilineText'
import type { Overview } from '../types/content'

interface OverviewSectionProps {
  overview: Overview
}

export function OverviewSection({ overview }: OverviewSectionProps) {
  return (
    <>
      <div className="sec-header">
        <div className="sec-header-label">04</div>
        <div className="sec-header-title">赛事概览</div>
        <div className="sec-header-count">FIFA WC 2026™</div>
      </div>
      <div className="ov-wrap">
        <div className="stats-strip">
          {overview.stats.map((stat) => (
            <div key={stat.label} className="stat-cell">
              <div className="stat-n">{stat.value}</div>
              <div className="stat-l">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="hosts-row">
          {overview.hosts.map((host) => (
            <div key={host.name} className="host-cell">
              <div className="host-flag">{host.flag}</div>
              <div className="host-info">
                <div className="host-name">{host.name}</div>
                <MultilineText className="host-detail" lines={host.detail} />
              </div>
            </div>
          ))}
        </div>

        <div className="favs-section">
          <div className="favs-title">{overview.favoritesTitle}</div>
          <div className="favs-list">
            {overview.favorites.map((favorite) => (
              <div key={favorite.rank} className="fav-row">
                <div className="fav-rank">{favorite.rank}</div>
                <div className="fav-flag">{favorite.flag}</div>
                <div className="fav-name">{favorite.name}</div>
                <div className="fav-group">{favorite.group}</div>
                <div className="fav-odds">{favorite.odds}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
