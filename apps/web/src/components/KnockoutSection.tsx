import { MultilineText } from './MultilineText'
import type { Knockout } from '@world2026/content-contract'

interface KnockoutSectionProps {
  knockout: Knockout
}

export function KnockoutSection({ knockout }: KnockoutSectionProps) {
  return (
    <>
      <div className="sec-header">
        <div className="sec-header-label">03</div>
        <div className="sec-header-title">淘汰赛阶段</div>
        <div className="sec-header-count">KNOCKOUT · 32 MATCHES</div>
      </div>
      <div className="ko-wrap">
        <div className="ko-stages">
          {knockout.stages.map((stage) => (
            <div key={stage.name} className="ko-col">
              <div className="ko-col-head">
                <div className="ko-col-name">{stage.name}</div>
                <div className="ko-col-date">{stage.date}</div>
              </div>
              <div className="ko-col-body">
                <div className="ko-stat-big">{stage.stat}</div>
                <div className="ko-stat-label">{stage.label}</div>
                <MultilineText as="p" className="ko-desc" lines={stage.description} />
              </div>
            </div>
          ))}
        </div>

        <div className="ko-final-wrap">
          <div className="kf-cell">
            <div className="kf-eyebrow">{knockout.final.venue.eyebrow}</div>
            <MultilineText className="kf-big" lines={knockout.final.venue.title} />
            <MultilineText className="kf-detail" lines={knockout.final.venue.detail} />
          </div>
          <div className="kf-divider"></div>
          <div className="kf-cell-mid">
            <span className="kf-trophy">{knockout.final.center.trophy}</span>
            <MultilineText className="kf-mid-title" lines={knockout.final.center.title} />
            <div className="kf-mid-date">{knockout.final.center.date}</div>
          </div>
          <div className="kf-divider"></div>
          <div className="kf-cell">
            <div className="kf-eyebrow">{knockout.final.format.eyebrow}</div>
            <MultilineText className="kf-big kf-big-small" lines={knockout.final.format.title} />
            <MultilineText className="kf-detail" lines={knockout.final.format.detail} />
          </div>
        </div>
      </div>
    </>
  )
}
