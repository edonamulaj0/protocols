import { motion } from 'framer-motion'

function tone(score) {
  if (score <= 40) return 'text-rose-200 ring-rose-500/45 bg-rose-950/55'
  if (score <= 70) return 'text-amber-100 ring-amber-500/40 bg-amber-950/45'
  return 'text-emerald-100 ring-emerald-500/40 bg-emerald-950/45'
}

export function CivilityBadge({ value, className = '' }) {
  const v = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <motion.span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone(v)} ${className}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
    >
      Civility: {v}
    </motion.span>
  )
}
