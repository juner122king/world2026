import { MultilineText } from './MultilineText'
import type { Hero as HeroContent } from '../types/content'
import type { CountdownState } from '../hooks/useCountdown'

interface HeroProps {
  hero: HeroContent
  countdown: CountdownState
}

const countdownUnits: Array<{ key: keyof Pick<CountdownState, 'days' | 'hours' | 'minutes' | 'seconds'>; label: string }> = [
  { key: 'days', label: 'DAY' },
  { key: 'hours', label: 'HOUR' },
  { key: 'minutes', label: 'MIN' },
  { key: 'seconds', label: 'SEC' },
]

export function Hero({ hero, countdown }: HeroProps) {
  const isLive = countdown.status === 'live'
  const isPending = countdown.status === 'loading' || countdown.status === 'invalid'
  const heroRightClassName = [
    'hero-right',
    countdown.status === 'countdown' ? `hero-right-pulse pulse-${countdown.pulsePhase}` : '',
    isLive ? 'hero-right-live' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const countdownGridClassName =
    countdown.status === 'countdown'
      ? `hero-count-grid hero-count-grid-pulse pulse-${countdown.pulsePhase}`
      : 'hero-count-grid'

  return (
    <header className="hero">
      <div className="hero-bg-num">26</div>
      <div className="hero-left">
        <div className="hero-eyebrow">{hero.eyebrow}</div>
        <h1 className="hero-title">
          <MultilineText as="span" className="wc" lines={hero.title.main} />
          <span className="year">{hero.title.year}</span>
        </h1>
        <div className="hero-meta">
          {hero.badges.map((badge) => (
            <span key={badge.text} className={badge.highlighted ? 'hero-badge hl' : 'hero-badge'}>
              {badge.text}
            </span>
          ))}
        </div>
      </div>
      <div className={heroRightClassName}>
        <div className="hero-count-label">{hero.countdownLabel}</div>
        {countdown.status === 'countdown' && (
          <>
            <div className={countdownGridClassName} aria-label="世界杯开幕倒计时">
              {countdownUnits.map((unit) => (
                <div key={unit.key} className="hero-count-card">
                  <div className="hero-count-value">{countdown[unit.key]}</div>
                  <div className="hero-count-unit">{unit.label}</div>
                </div>
              ))}
            </div>
            <div className="hero-count-inline">{countdown.compactText}</div>
          </>
        )}
        {isLive && (
          <div className="hero-live-card hero-live-card-enter" aria-label="世界杯开幕状态">
            <div className="hero-live-kicker">OPENING MATCH</div>
            <div className="hero-live-title">已开赛</div>
            <div className="hero-live-sub">LIVE NOW</div>
          </div>
        )}
        {isPending && (
          <div className="hero-live-card hero-live-card-muted" aria-label="世界杯开幕时间状态">
            <div className="hero-live-kicker">COUNTDOWN</div>
            <div className="hero-live-title">等待刷新</div>
            <div className="hero-live-sub">
              {countdown.status === 'invalid' ? 'TIME TBC' : 'SYNCING'}
            </div>
          </div>
        )}
        <MultilineText className="hero-count-sub" lines={hero.countdownSubtext} />
      </div>
    </header>
  )
}
