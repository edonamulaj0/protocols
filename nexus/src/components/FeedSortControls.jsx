const OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most popular' },
]

export function FeedSortControls({ value, onChange, className = '' }) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Sort discussions"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ring-1 transition-colors ${
            value === o.value
              ? 'bg-[var(--navy-700)] text-[var(--text)] ring-[var(--navy-400)]/40'
              : 'text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
