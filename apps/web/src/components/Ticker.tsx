interface TickerProps {
  items: string[]
}

export function Ticker({ items }: TickerProps) {
  const loopItems = [...items, ...items]

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {loopItems.map((item, index) => (
          <span key={`${item}-${index}`}>
            {item}
            {index < loopItems.length - 1 && <span className="sep">///</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
