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
import type { SectionId, WorldCupContent } from './types/content'

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
