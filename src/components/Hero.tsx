import { MultilineText } from './MultilineText'
import type { Hero as HeroContent } from '../types/content'

interface HeroProps {
  hero: HeroContent
  countdownLabel: string
}

export function Hero({ hero, countdownLabel }: HeroProps) {
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
      <div className="hero-right">
        <div className="hero-count-label">{hero.countdownLabel}</div>
        <div className="hero-count-num" id="hero-days">{countdownLabel}</div>
        <MultilineText className="hero-count-sub" lines={hero.countdownSubtext} />
      </div>
    </header>
  )
}
