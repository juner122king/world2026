import { flagImages } from '../lib/flagImages'

interface CountryFlagProps {
  code: string
  label: string
  className?: string
}

export function CountryFlag({ code, label, className }: CountryFlagProps) {
  const normalizedCode = code.trim().toLowerCase()
  const src = flagImages[normalizedCode]
  const nextClassName = ['country-flag', className].filter(Boolean).join(' ')

  if (!src) {
    return (
      <span className={nextClassName} aria-label={`${label}国旗`} title={label}>
        {normalizedCode.toUpperCase()}
      </span>
    )
  }

  return <img src={src} alt="" aria-hidden="true" className={nextClassName} title={label} loading="lazy" decoding="async" />
}
