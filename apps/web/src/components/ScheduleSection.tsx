import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MultilineText } from './MultilineText'
import type { MatchPrediction, WorldCupContent } from '@world2026/content-contract'
import { CountryFlag } from './CountryFlag'
import { createMatchPredictionKey, createMatchPredictionRequest } from '../lib/predictions'
import { fetchMatchPrediction } from '../services/predictionApi'

const CHINESE_MONTHS: Record<string, number> = {
  '一月': 1, '二月': 2, '三月': 3, '四月': 4,
  '五月': 5, '六月': 6, '七月': 7, '八月': 8,
  '九月': 9, '十月': 10, '十一月': 11, '十二月': 12,
}

interface ScheduleSectionProps {
  schedule: WorldCupContent['schedule']
  autoScroll?: boolean
}

export function ScheduleSection({ schedule, autoScroll }: ScheduleSectionProps) {
  const [predictions, setPredictions] = useState<Record<string, MatchPrediction>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showFab, setShowFab] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const fabTargetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const setMatchRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) {
      matchRefs.current.set(key, el)
    } else {
      matchRefs.current.delete(key)
    }
  }, [])

  // IntersectionObserver: hide fab when target match is visible
  useEffect(() => {
    const targetEl = fabTargetRef.current
    if (!targetEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If target is in viewport → hide fab; otherwise show it
        setShowFab(!entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(targetEl)
    return () => observer.disconnect()
  }, [])

  const findTargetKey = useCallback((): string | null => {
    const now = new Date()
    const today = now.getDate()
    const thisMonth = now.getMonth() + 1

    let liveKey: string | null = null
    let todayKey: string | null = null
    let upcomingKey: string | null = null

    for (const day of schedule.days) {
      const dayNum = parseInt(day.day, 10)
      const monthNum = CHINESE_MONTHS[day.month] ?? 0

      for (const match of day.matches) {
        const matchKey = createMatchPredictionKey(day, match)

        if (match.status === 'live' && !liveKey) {
          liveKey = matchKey
        }

        if (dayNum === today && monthNum === thisMonth && !todayKey) {
          todayKey = matchKey
        }

        if (!upcomingKey && (monthNum > thisMonth || (monthNum === thisMonth && dayNum >= today))) {
          upcomingKey = matchKey
        }
      }
    }

    return liveKey ?? todayKey ?? upcomingKey
  }, [schedule.days])

  const scrollToTarget = useCallback((delay = 0) => {
    const targetKey = findTargetKey()
    if (targetKey) {
      // Update the ref for IntersectionObserver so it watches the right element
      fabTargetRef.current = matchRefs.current.get(targetKey) ?? null

      const scroll = () => {
        const el = matchRefs.current.get(targetKey)
        if (!el) return
        const rect = el.getBoundingClientRect()
        // Scroll so the match card sits below the date header
        window.scrollTo({
          top: window.scrollY + rect.top - 160,
          behavior: 'smooth',
        })
      }
      if (delay > 0) {
        setTimeout(scroll, delay)
      } else {
        scroll()
      }
    }
  }, [findTargetKey])

  useEffect(() => {
    if (!autoScroll) return
    // Wait for the tab-pane reveal animation (0.3s) to finish
    scrollToTarget(350)
  }, [autoScroll, scrollToTarget])

  async function handleGeneratePrediction(day: WorldCupContent['schedule']['days'][number], match: WorldCupContent['schedule']['days'][number]['matches'][number]) {
    const request = createMatchPredictionRequest(day, match)

    if (predictions[request.matchKey] || loadingKey === request.matchKey) {
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      setLoadingKey(request.matchKey)
      setErrorKey(null)
      setErrorMessage(null)
      const prediction = await fetchMatchPrediction(request, controller.signal)
      setPredictions((current) => ({
        ...current,
        [request.matchKey]: prediction,
      }))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setErrorKey(request.matchKey)
      setErrorMessage(error instanceof Error ? error.message : '预测暂时不可用。')
    } finally {
      setLoadingKey((current) => (current === request.matchKey ? null : current))
    }
  }

  const hasLive = schedule.days.some((d) => d.matches.some((m) => m.status === 'live'))

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
            {day.matches.map((match) => {
              const matchKey = createMatchPredictionKey(day, match)
              const targetKey = findTargetKey()
              const isTarget = matchKey === targetKey
              const prediction = predictions[matchKey]
              const isLoading = loadingKey === matchKey
              const hasError = errorKey === matchKey
              const hasScore = typeof match.score?.home === 'number' && typeof match.score?.away === 'number'
              const showScore = hasScore
              const statusClassName = match.status ? `match-status match-status-${match.status}` : 'match-status'

              return (
                <div
                  key={matchKey}
                  className="match-card"
                  ref={(el) => {
                    setMatchRef(matchKey, el)
                    if (isTarget) {
                      fabTargetRef.current = el
                    }
                  }}
                >
                  <div className="match-row">
                    <div className="mr-time">
                      <div className="mr-time-label">{match.time}</div>
                      {match.status === 'live' && <div className={statusClassName}>{match.statusLabel ?? '进行中'}</div>}
                      {match.status === 'finished' && <div className={statusClassName}>{match.statusLabel ?? '已完赛'}</div>}
                    </div>
                    <div className="mr-main">
                      <div className="mr-home">
                        <span className="mr-team-name">
                          <CountryFlag code={match.home.flagCode} label={match.home.name} className="mr-team-flag" />
                          <span>{match.home.name}</span>
                        </span>
                      </div>
                      <div className="mr-vs">
                        <div className="mr-vs-label">{showScore ? '全场' : 'VS'}</div>
                        {showScore ? (
                          <div className="mr-score">
                            <span>{match.score?.home}</span>
                            <span className="mr-score-sep">-</span>
                            <span>{match.score?.away}</span>
                          </div>
                        ) : (
                          <div className="mr-score mr-score-pending">
                            <span>-</span>
                            <span className="mr-score-sep">:</span>
                            <span>-</span>
                          </div>
                        )}
                      </div>
                      <div className="mr-away">
                        <span className="mr-team-name">
                          <CountryFlag code={match.away.flagCode} label={match.away.name} className="mr-team-flag" />
                          <span>{match.away.name}</span>
                        </span>
                      </div>
                    </div>
                    <div className="mr-info">
                      <div className="mr-group">{match.group}</div>
                      <MultilineText className="mr-venue" lines={match.venue} />
                    </div>
                  </div>
                  <div className="match-prediction-panel">
                    <button
                      type="button"
                      className="match-predict-btn"
                      onClick={() => void handleGeneratePrediction(day, match)}
                      disabled={Boolean(prediction) || isLoading}
                    >
                      {prediction ? '预测已生成' : isLoading ? '生成中…' : '生成本场预测'}
                    </button>
                    {hasError && errorMessage && <div className="match-prediction-error">{errorMessage}</div>}
                    {prediction && (
                      <div className="match-prediction-result">
                        <div className="match-prediction-head">
                          <span>AI 结论 · {prediction.summary}</span>
                          <span>置信度 · {prediction.confidence}</span>
                        </div>
                        <div className="match-prediction-meta">
                          模型 · {prediction.modelVersion} · 基线 · {prediction.basisUpdatedAt} · 状态 · {prediction.status}
                        </div>
                        <div className="match-prediction-probabilities">
                          <div>{match.home.name} {prediction.probabilities.home}%</div>
                          <div>平局 {prediction.probabilities.draw}%</div>
                          <div>{match.away.name} {prediction.probabilities.away}%</div>
                        </div>
                        <MultilineText className="match-prediction-reasoning" lines={prediction.reasoning} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div className="schedule-note">{schedule.note}</div>
      </div>
      {showFab && createPortal(
        <button
          type="button"
          className={hasLive ? 'sched-fab sched-fab--live' : 'sched-fab'}
          onClick={() => scrollToTarget()}
          aria-label={hasLive ? '回到直播比赛' : '回到今天的比赛'}
        >
          {hasLive ? '● 直播中' : '↓ 今天'}
        </button>,
        document.body,
      )}
    </>
  )
}
