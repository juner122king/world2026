import type { SectionId } from '../types/content'

interface SectionTabsProps {
  activeSection: SectionId
  onChange: (section: SectionId) => void
  countdownLabel: string
}

const tabs: Array<{ id: SectionId; label: string }> = [
  { id: 'groups', label: '小组赛' },
  { id: 'schedule', label: '赛程' },
  { id: 'knockout', label: '淘汰赛' },
  { id: 'overview', label: '概览' },
]

export function SectionTabs({ activeSection, onChange, countdownLabel }: SectionTabsProps) {
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
      <div className="nav-countdown">
        <div className="nav-countdown-num" id="nav-days">{countdownLabel}</div>
        <div className="nav-countdown-label">天<br />倒计时</div>
      </div>
    </nav>
  )
}
