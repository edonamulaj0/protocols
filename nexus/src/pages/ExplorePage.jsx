import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useFeedStore } from '../stores/feedStore'
import { DiscussionCard } from '../components/DiscussionCard'
import { FeedSortControls } from '../components/FeedSortControls'
import { EXPLORE_CATEGORIES, orderPostsForDisplay } from '../lib/feedOrdering'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export function ExplorePage() {
  const posts = useFeedStore((s) => s.posts)
  const [cat, setCat] = useState('All')
  const [sort, setSort] = useState('relevance')

  const categoryCounts = useMemo(() => {
    const m = { All: posts.length }
    for (const c of EXPLORE_CATEGORIES) {
      if (c !== 'All') m[c] = 0
    }
    for (const p of posts) {
      const label = p.category || 'Society'
      if (m[label] === undefined) m[label] = 0
      m[label] += 1
    }
    return m
  }, [posts])

  const filtered = useMemo(() => {
    if (cat === 'All') return posts
    return posts.filter((p) => (p.category || 'Society') === cat)
  }, [posts, cat])

  const displayPosts = useMemo(
    () => orderPostsForDisplay(filtered, sort, posts),
    [filtered, sort, posts],
  )

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-[var(--text)]">Explore</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pick a category, then sort by relevance, recency, or engagement. Same feed as Home—filtered
        here in the browser.
      </p>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <aside className="shrink-0 lg:w-56 xl:w-60">
          <h2 className="font-heading text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Categories
          </h2>
          <ul className="mt-3 flex flex-col gap-1 border border-[var(--border)] rounded-2xl bg-[var(--surface)]/40 p-1.5">
            {EXPLORE_CATEGORIES.map((label) => {
              const count = categoryCounts[label] ?? 0
              const active = cat === label
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setCat(label)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[var(--navy-700)] text-[var(--text)] ring-1 ring-[var(--navy-400)]/35'
                        : 'text-[var(--muted)] hover:bg-[var(--navy-900)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`tabular-nums text-xs font-bold ${
                        active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="min-w-0 flex-1">
          <FeedSortControls value={sort} onChange={setSort} className="mb-6" />
          <motion.div
            className="flex flex-col gap-7"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {displayPosts.map((p) => (
              <DiscussionCard key={p.id} post={p} />
            ))}
          </motion.div>
          {!displayPosts.length && (
            <p className="mt-12 text-center text-sm text-[var(--muted)]">Nothing in this bucket yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
