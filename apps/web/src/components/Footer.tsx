import type { Meta } from '@world2026/content-contract'

interface FooterProps {
  meta: Meta
  currentSection: string
}

export function Footer({ meta, currentSection }: FooterProps) {
  return (
    <footer>
      <div className="footer-text">
        数据来源：{meta.sources.join(' · ')} · {meta.updatedAt} · 当前区块：{currentSection}
      </div>
      <div className="footer-mark">{meta.title}</div>
    </footer>
  )
}
