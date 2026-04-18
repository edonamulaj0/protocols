import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useFeedStore } from '../stores/feedStore'
import { DiscussionCard } from '../components/DiscussionCard'

const TABS = ['All', 'Politics', 'Tech', 'Society', 'Science', 'Culture']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export function ExplorePage() {
  const posts = useFeedStore((s) => s.posts)
  const [cat, setCat] = useState('All')

  const filtered = useMemo(() => {
    if (cat === 'All') return posts
    return posts.filter((p) => (p.category || 'Society') === cat)
  }, [posts, cat])

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-[var(--text)]">Explore</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Browse by category. Same live feed, filtered client-side.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <motion.button
            key={t}
            type="button"
            onClick={() => setCat(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ring-1 ${
              cat === t
                ? 'bg-[var(--navy-700)] text-[var(--text)] ring-[var(--navy-400)]/40'
                : 'text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {t}
          </motion.button>
        ))}
      </div>
      <motion.div
        className="mt-8 flex flex-col gap-7"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((p) => (
          <DiscussionCard key={p.id} post={p} />
        ))}
      </motion.div>
      {!filtered.length && (
        <p className="mt-12 text-center text-sm text-[var(--muted)]">Nothing in this bucket yet.</p>
      )}
    </div>
  )
}
