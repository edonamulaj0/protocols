import { motion, useSpring, useMotionValueEvent } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeedStore } from '../stores/feedStore'

export function TrendingPanel() {
  const posts = useFeedStore((s) => s.posts)
  const trending = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.num_comments || 0) - (a.num_comments || 0))
      .slice(0, 8)
  }, [posts])

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="font-heading mb-4 text-lg font-semibold text-[var(--text)]">
        Trending Now <span aria-hidden>🔥</span>
      </h2>
      <ol className="space-y-3">
        {trending.map((p, i) => (
          <TrendingRow key={p.id} rank={i + 1} post={p} comments={p.num_comments || 0} />
        ))}
      </ol>
    </aside>
  )
}

function TrendingRow({ rank, post, comments }) {
  const spring = useSpring(comments, { stiffness: 120, damping: 18 })
  const [label, setLabel] = useState(comments)
  useMotionValueEvent(spring, 'change', (v) => setLabel(Math.round(v)))
  useEffect(() => {
    spring.set(comments)
  }, [comments, spring])

  return (
    <li>
      <Link
        to={`/discussion/${post.id}`}
        className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--navy-900)]/80"
      >
        <span className="font-heading w-5 pt-0.5 text-sm text-[var(--muted)]">{rank}</span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">{post.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="rounded bg-[var(--navy-800)] px-1.5 py-0.5">
              {post.subreddit || post.source}
            </span>
            <motion.span key={label}>{label}</motion.span>
            <span>comments</span>
          </div>
        </div>
      </Link>
    </li>
  )
}
