import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { CivilityBadge } from './CivilityBadge'
import { StanceBar } from './StanceBar'
import { useUserStore } from '../stores/userStore'

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

function formatTime(createdUtc) {
  const sec = Math.max(0, Math.floor(Date.now() / 1000 - (createdUtc || 0)))
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

function formatScore(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function DiscussionCard({ post }) {
  const [stance, setStance] = useState(null)
  const dist = post.stanceDistribution || { for: 33, against: 34, neutral: 33 }
  const liked = useUserStore((s) => (s.likedDiscussionIds ?? []).includes(post.id))
  const toggleLike = useUserStore((s) => s.toggleDiscussionLike)

  return (
    <motion.div variants={cardVariants} className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--navy-900)] shadow-[0_16px_50px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--navy-400)]/45 hover:shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
        <Link
          to={`/discussion/${post.id}`}
          state={{ preferredStance: stance }}
          className="group flex min-h-0 flex-1 flex-col outline-none"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5 text-xs text-[var(--muted)]">
            <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-semibold text-[var(--text)] ring-1 ring-[var(--border)]">
              {post.subreddit || post.source}
            </span>
            <span>{formatTime(post.createdUtc)}</span>
          </div>
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-[var(--navy-800)]">
            <img
              src={post.imageUrl || post.thumbnail || 'https://picsum.photos/seed/nexus/960/520'}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--navy-950)]/90 via-transparent to-transparent" />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="font-heading line-clamp-2 text-xl font-semibold leading-snug text-[var(--text)] group-hover:text-white">
              {post.title}
            </h3>
            <div className="mt-4">
              <StanceBar distribution={dist} commentCount={post.num_comments} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              <span>💬 {post.num_comments ?? 0}</span>
              <span>↑ {formatScore(post.score ?? 0)}</span>
              <CivilityBadge value={post.civility ?? 70} />
            </div>
          </div>
        </Link>
        <div
          className="border-t border-[var(--border)] px-4 pb-4 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Your stance before opening
          </span>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {['For', 'Against', 'Neutral'].map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setStance(s)
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                    stance === s
                      ? 'bg-[var(--accent)] text-[var(--navy-950)] ring-[var(--accent)]'
                      : 'bg-[var(--navy-800)] text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]'
                  }`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
            <motion.button
              type="button"
              aria-label={liked ? 'Unlike' : 'Like discussion'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
                liked
                  ? 'text-rose-400 ring-rose-500/40 bg-rose-950/40'
                  : 'text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]'
              }`}
              onClick={(e) => {
                e.preventDefault()
                toggleLike(post.id, post.title)
              }}
              whileTap={{ scale: 0.92 }}
            >
              {liked ? <AiFillHeart className="h-5 w-5" /> : <AiOutlineHeart className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
