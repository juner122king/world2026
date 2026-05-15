import { useEffect, useRef, useState } from 'react'
import { MultilineText } from './MultilineText'
import type { MatchPrediction, WorldCupContent } from '../types/content'
import { CountryFlag } from './CountryFlag'
import { createMatchPredictionKey, createMatchPredictionRequest } from '../lib/predictions'
import { fetchMatchPrediction } from '../services/predictionApi'

interface ScheduleSectionProps {
  schedule: WorldCupContent['schedule']
}

export function ScheduleSection({ schedule }: ScheduleSectionProps) {
  const [predictions, setPredictions] = useState<Record<string, MatchPrediction>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

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
              const prediction = predictions[matchKey]
              const isLoading = loadingKey === matchKey
              const hasError = errorKey === matchKey

              return (
                <div key={matchKey} className="match-card">
                  <div className="match-row">
                    <div className="mr-time">{match.time}</div>
                    <div className="mr-home">
                      <span className="mr-team-name">
                        <CountryFlag code={match.home.flagCode} label={match.home.name} className="mr-team-flag" />
                        <span>{match.home.name}</span>
                      </span>
                    </div>
                    <div className="mr-vs">VS</div>
                    <div className="mr-away">
                      <span className="mr-team-name">
                        <CountryFlag code={match.away.flagCode} label={match.away.name} className="mr-team-flag" />
                        <span>{match.away.name}</span>
                      </span>
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
    </>
  )
}
