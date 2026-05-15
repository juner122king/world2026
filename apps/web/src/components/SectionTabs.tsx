import type { SectionId } from '@world2026/content-contract'
import type { CountdownState } from '../hooks/useCountdown'

interface SectionTabsProps {
  activeSection: SectionId
  onChange: (section: SectionId) => void
  countdown: CountdownState
}

const tabs: Array<{ id: SectionId; label: string }> = [
  { id: 'groups', label: '小组赛' },
  { id: 'schedule', label: '赛程' },
  { id: 'knockout', label: '淘汰赛' },
  { id: 'overview', label: '概览' },
]

export function SectionTabs({ activeSection, onChange, countdown }: SectionTabsProps) {
  const isLive = countdown.status === 'live'
  const isPending = countdown.status === 'loading' || countdown.status === 'invalid'
  const navCountdownClassName = [
    'nav-countdown',
    isLive ? 'live nav-countdown-enter' : '',
    countdown.status === 'countdown' ? `nav-countdown-pulse pulse-${countdown.pulsePhase}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <nav className="nav-bar">
      <div className="nav-logo">WC26</div>
      <div className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeSection === tab.id ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={navCountdownClassName}>
        <div className="nav-countdown-num" id="nav-days">
          {isLive ? 'LIVE' : countdown.compactText}
        </div>
        <div className="nav-countdown-label">
          {isLive ? '已开赛' : isPending ? '倒计时刷新中' : 'DAY : HOUR : MIN : SEC'}
        </div>
      </div>
    </nav>
  )
}
