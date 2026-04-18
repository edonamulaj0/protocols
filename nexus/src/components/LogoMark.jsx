import { Link } from 'react-router-dom'

export function LogoMark({ className = '' }) {
  return (
    <Link to="/" className={`flex items-baseline font-heading ${className}`}>
      <span className="text-xl font-semibold tracking-[0.14em] text-[var(--text)] sm:text-2xl">NE</span>
      <span className="relative inline-block text-xl font-semibold tracking-[0.14em] text-[var(--text)] sm:text-2xl">
        X
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_rgba(232,200,74,0.75)]"
          aria-hidden
        />
      </span>
      <span className="text-xl font-semibold tracking-[0.14em] text-[var(--text)] sm:text-2xl">US</span>
    </Link>
  )
}
