interface MultilineTextProps {
  as?: 'div' | 'p' | 'span'
  className?: string
  lines: string[]
}

export function MultilineText({ as = 'div', className, lines }: MultilineTextProps) {
  const Component = as

  return (
    <Component className={className}>
      {lines.map((line) => (
        <span key={line}>
          {line}
          <br />
        </span>
      ))}
    </Component>
  )
}
