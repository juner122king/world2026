import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { Footer } from './components/Footer'
import { GroupsSection } from './components/GroupsSection'
import { Hero } from './components/Hero'
import { KnockoutSection } from './components/KnockoutSection'
import { OverviewSection } from './components/OverviewSection'
import { ScheduleSection } from './components/ScheduleSection'
import { SectionTabs } from './components/SectionTabs'
import { Ticker } from './components/Ticker'
import { useCountdown } from './hooks/useCountdown'
import { fetchWorldCupContent } from './services/contentApi'
import type { SectionId, WorldCupContent } from '@world2026/content-contract'

const sectionTitles: Record<SectionId, string> = {
  groups: '小组赛',
  schedule: '赛程',
  knockout: '淘汰赛',
  overview: '概览',
}

interface SectionDefinition {
  id: SectionId
  render: (content: WorldCupContent) => ReactNode
}

const sections: SectionDefinition[] = [
  {
    id: 'groups',
    render: (content) => <GroupsSection groups={content.groups} />,
  },
  {
    id: 'schedule',
    render: (content) => <ScheduleSection schedule={content.schedule} />,
  },
  {
    id: 'knockout',
    render: (content) => <KnockoutSection knockout={content.knockout} />,
  },
  {
    id: 'overview',
    render: (content) => (
      <OverviewSection
        overview={content.overview}
        overallPrediction={content.predictions?.overall}
      />
    ),
  },
]

export default function App() {
  const [content, setContent] = useState<WorldCupContent | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('groups')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const countdownDate = content?.hero.openingDate ?? ''
  const countdown = useCountdown(countdownDate)

  useEffect(() => {
    const controller = new AbortController()

    async function loadContent() {
      try {
        setLoading(true)
        setError(null)
        const nextContent = await fetchWorldCupContent(controller.signal)
        setContent(nextContent)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '内容加载失败，请稍后重试。')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadContent()

    return () => {
      controller.abort()
    }
  }, [])

  if (loading) {
    return <main className="status-screen">正在加载 2026 世界杯数据…</main>
  }

  if (error || !content) {
    return (
      <main className="status-screen status-screen-error">
        <p>页面内容暂时无法加载。</p>
        <p>{error ?? '请稍后重试。'}</p>
      </main>
    )
  }

  const activeContent = sections.find((section) => section.id === activeSection)

  return (
    <>
      <a
        className="github-fab"
        href="https://github.com/juner122king/world2026"
        target="_blank"
        rel="noreferrer"
        aria-label="Open GitHub project"
      >
        <svg
          className="github-fab-icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38
            0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
            -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07
            -.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2
            -.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.7 7.7 0 0 1 8 4.37c.68 0 1.36.09 2 .27
            1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
            0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
            0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
      </a>
      <Ticker items={content.ticker} />
      <Hero hero={content.hero} countdown={countdown} overallPrediction={content.predictions?.overall} />
      <SectionTabs
        activeSection={activeSection}
        onChange={setActiveSection}
        countdown={countdown}
      />
      {activeContent && <section className="tab-pane on">{activeContent.render(content)}</section>}
      <Footer meta={content.meta} currentSection={sectionTitles[activeSection]} />
      <Analytics />
    </>
  )
}
