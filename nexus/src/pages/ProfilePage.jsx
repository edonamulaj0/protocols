import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

function stancePill(stance) {
  if (stance === 'For') return 'text-[var(--for)] ring-emerald-500/35'
  if (stance === 'Against') return 'text-[var(--against)] ring-rose-500/35'
  return 'text-[var(--neutral)] ring-slate-500/30'
}

const defaultStats = {
  postsCreated: 0,
  upvotesGiven: 0,
  downvotesGiven: 0,
  likesGiven: 0,
}

export function ProfilePage() {
  const { username: routeName } = useParams()
  const selfName = useUserStore((s) => s.name)
  const selfEmail = useUserStore((s) => s.email)
  const age = useUserStore((s) => s.age)
  const commentHistory = useUserStore((s) => s.commentHistory)
  const joinedDiscussionIds = useUserStore((s) => s.joinedDiscussionIds)
  const stats = useUserStore((s) => ({ ...defaultStats, ...s.stats }))
  const activityFeed = useUserStore((s) => s.activityFeed || [])
  const categoryEngagement = useUserStore((s) => s.categoryEngagement())

  const displayName = routeName === 'me' ? selfName?.trim() || 'Signed-out' : routeName
  const isOwn = routeName === 'me' || (!!selfName && routeName === selfName)

  const cats = ['Politics', 'Tech', 'Society', 'Science', 'Culture']
  const maxCat = Math.max(1, ...cats.map((c) => (isOwn ? categoryEngagement[c] : 0) || 0))

  const historyRows = isOwn ? commentHistory : []

  const statTiles = [
    { label: 'Posts started', value: stats.postsCreated },
    { label: 'Comments', value: commentHistory.length },
    { label: 'Likes (threads)', value: stats.likesGiven },
    { label: 'Upvotes given', value: stats.upvotesGiven },
    { label: 'Downvotes given', value: stats.downvotesGiven },
    { label: 'Discussions joined', value: isOwn ? joinedDiscussionIds.length : 0 },
  ]

  return (
    <div>
      <header className="border-b border-[var(--border)] pb-8">
        <h1 className="font-heading text-3xl font-semibold text-[var(--text)]">{displayName}</h1>
        {isOwn && selfEmail && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            <span className="text-[var(--text)]">{selfEmail}</span>
            {age != null && (
              <>
                {' '}
                · Age <span className="text-[var(--text)]">{age}</span>
              </>
            )}{' '}
            · stored on this device only
          </p>
        )}
        {!isOwn && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Profiles are device-local in this MVP—URLs other than <code className="text-[var(--text)]">/profile/me</code> show an empty public
            shell.
          </p>
        )}
      </header>

      {isOwn && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Activity</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statTiles.map((t) => (
              <div
                key={t.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-center"
              >
                <p className="font-heading text-2xl font-semibold text-[var(--accent)]">{t.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOwn && (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Topic mix</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Comments by category.</p>
          <div className="mt-4 space-y-3">
            {cats.map((c) => (
              <div key={c}>
                <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                  <span>{c}</span>
                  <span>{categoryEngagement[c] || 0}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--navy-900)] ring-1 ring-[var(--border)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--navy-400)]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((categoryEngagement[c] || 0) / maxCat) * 100}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOwn && (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Activity history</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Posts, likes, comments, and votes (newest first).</p>
          <ul className="mt-4 space-y-2">
            {activityFeed.length === 0 && (
              <li className="text-sm text-[var(--muted)]">No activity yet.</li>
            )}
            {activityFeed.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--navy-900)] px-3 py-2.5 text-sm"
              >
                <span className="font-medium capitalize text-[var(--navy-400)]">{a.type}</span>
                <span className="min-w-0 flex-1 text-[var(--text)]">{a.title || '—'}</span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(a.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Comment threads</h2>
        <ul className="mt-4 space-y-2">
          {historyRows.length === 0 && (
            <li className="text-sm text-[var(--muted)]">
              {isOwn ? 'No comments yet.' : 'No public history for this profile.'}
            </li>
          )}
          {historyRows.map((h) => (
            <li key={`${h.discussionId}-${h.at}`}>
              <Link
                to={`/discussion/${h.discussionId}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--navy-900)] px-3 py-2 text-sm transition-colors hover:border-[var(--navy-400)]/35"
              >
                <span className="min-w-0 flex-1 font-medium text-[var(--text)]">{h.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${stancePill(h.stance)}`}
                >
                  {h.stance}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
