import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CivilityBadge } from '../components/CivilityBadge'
import { StanceBar } from '../components/StanceBar'
import { useDiscussionStore } from '../stores/discussionStore'
import { useFeedStore } from '../stores/feedStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserStore } from '../stores/userStore'

function handleVote(postId, commentId, delta, voteComment, recordVoteGiven) {
  voteComment(postId, commentId, delta)
  recordVoteGiven(delta)
}

const tabs = [
  { id: 'sides', label: 'Both Sides' },
  { id: 'comments', label: 'Comments' },
  { id: 'sources', label: 'Sources' },
]

function stancePill(stance) {
  if (stance === 'For') return 'bg-emerald-950/70 text-[var(--for)] ring-emerald-500/35'
  if (stance === 'Against') return 'bg-rose-950/70 text-[var(--against)] ring-rose-500/35'
  return 'bg-slate-800/80 text-[var(--neutral)] ring-slate-500/30'
}

function DiscussionPageInner({ id, preferredStance }) {
  const hydrateFromFeed = useDiscussionStore((s) => s.hydrateFromFeed)
  const tab = useDiscussionStore((s) => s.tab)
  const setTab = useDiscussionStore((s) => s.setTab)
  const detail = useDiscussionStore((s) => (id ? s.detailById[id] : null))
  const addComment = useDiscussionStore((s) => s.addComment)
  const voteComment = useDiscussionStore((s) => s.voteComment)
  const setSort = useDiscussionStore((s) => s.setSort)
  const sortedComments = useDiscussionStore((s) => s.sortedComments)

  const displayName = useUserStore((s) => s.name)
  const canComment = useUserStore(
    (s) =>
      Boolean(
        s.googleSub?.trim() &&
          s.email?.trim() &&
          s.name?.trim() &&
          s.age != null &&
          s.age >= 13 &&
          s.age <= 120,
      ),
  )
  const recordComment = useUserStore((s) => s.recordComment)
  const recordVoteGiven = useUserStore((s) => s.recordVoteGiven)
  const pushNotif = useNotificationStore((s) => s.push)

  const [stance, setStance] = useState(preferredStance || null)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState(null)

  const { scrollY } = useScroll()
  const imgY = useTransform(scrollY, (v) => v * 0.3)

  useEffect(() => {
    if (!id) return
    hydrateFromFeed(id)
  }, [id, hydrateFromFeed])

  const post = detail?.post
  const comments = id ? sortedComments(id) : []

  const both = post?.bothSides

  const sourcesList = useMemo(() => {
    if (!post) return []
    const base = [...(post.sources || [])]
    for (const t of post.tweets || []) {
      base.push({
        type: 'twitter',
        title: (t.text || '').slice(0, 120),
        url: `https://twitter.com/i/web/status/${t.id}`,
        domain: 'twitter.com',
      })
    }
    return base
  }, [post])

  if (!post) {
    return (
      <p className="text-[var(--muted)]">
        Discussion not found.{' '}
        <Link to="/" className="text-[var(--navy-400)]">
          Back home
        </Link>
      </p>
    )
  }

  function onSubmitComment(e) {
    e.preventDefault()
    if (!stance || !draft.trim() || !canComment || !displayName?.trim()) return
    const text = draft.trim().slice(0, 500)
    addComment(post.id, {
      text,
      stance,
      username: displayName.trim(),
      parentId: replyTo,
    })
    recordComment({
      discussionId: post.id,
      title: post.title,
      category: post.category,
      stance,
    })
    pushNotif({
      type: 'reply',
      title: `Your comment is live on “${post.title.slice(0, 48)}…”`,
      body: 'Simulated notification — no server yet.',
      discussionId: post.id,
      icon: '💬',
      at: Date.now(),
    })
    setDraft('')
    setReplyTo(null)
    useFeedStore.setState((s) => ({
      posts: s.posts.map((p) =>
        p.id === post.id ? { ...p, num_comments: (p.num_comments || 0) + 1 } : p,
      ),
    }))
  }

  const bulletContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  }
  const bulletItem = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <div>
      <Link to="/" className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-[var(--text)]">
        ← Back to feed
      </Link>

      <div className="relative -mx-4 mb-8 overflow-hidden rounded-2xl lg:mx-0">
        <div className="relative aspect-[21/9] min-h-[200px] w-full">
          <motion.div className="absolute inset-0 scale-110" style={{ y: imgY }}>
            <img
              src={post.imageUrl || post.thumbnail || 'https://picsum.photos/seed/nexus/1200/520'}
              alt=""
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--navy-950)] via-[var(--navy-950)]/40 to-transparent" />
        </div>
      </div>

      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-semibold text-[var(--text)] ring-1 ring-[var(--border)]">
            {post.subreddit}
          </span>
          <CivilityBadge value={post.civility ?? 70} />
        </div>
        <h1 className="font-heading text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-5 max-w-xl">
          <StanceBar distribution={post.stanceDistribution} commentCount={post.num_comments} />
        </div>
      </header>

      <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
              tab === t.id ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId={`d-tab-${id}`}
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent)]"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 'sides' && both && (
            <div>
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  variants={bulletContainer}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--navy-900)] p-5"
                >
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--for)]">
                    🟢 Arguments For
                  </h2>
                  <ul className="space-y-2">
                    {(both.for || []).map((line, i) => (
                      <motion.li
                        key={i}
                        variants={bulletItem}
                        className="list-inside list-disc text-sm text-[var(--muted)]"
                      >
                        {line}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div
                  variants={bulletContainer}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--navy-900)] p-5"
                >
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--against)]">
                    🔴 Arguments Against
                  </h2>
                  <ul className="space-y-2">
                    {(both.against || []).map((line, i) => (
                      <motion.li
                        key={i}
                        variants={bulletItem}
                        className="list-inside list-disc text-sm text-[var(--muted)]"
                      >
                        {line}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
              {both.common_ground && (
                <p className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-sm italic text-[var(--neutral)]">
                  {both.common_ground}
                </p>
              )}
            </div>
          )}

          {tab === 'sides' && !both && (
            <p className="text-sm text-[var(--muted)]">
              Both-sides analysis is still processing, or this thread uses the offline corpus only.
            </p>
          )}

          {tab === 'comments' && (
            <div>
              {!canComment && (
                <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--muted)]">
                  Sign in with Google and confirm your age from the prompt to comment.
                </p>
              )}
              <form onSubmit={onSubmitComment} className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Stance (required)
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {['For', 'Against', 'Neutral'].map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => setStance(s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                        stance === s
                          ? 'bg-[var(--accent)] text-[var(--navy-950)] ring-[var(--accent)]'
                          : 'bg-[var(--navy-900)] text-[var(--muted)] ring-[var(--border)]'
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
                {replyTo && (
                  <p className="mb-2 text-xs text-[var(--navy-400)]">
                    Replying to comment —{' '}
                    <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                      cancel
                    </button>
                  </p>
                )}
                <textarea
                  value={draft}
                  maxLength={500}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  placeholder="Add to the thread…"
                  className="mb-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--navy-900)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--navy-400)]/45"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">{draft.length}/500</span>
                  <motion.button
                    type="submit"
                    disabled={!stance || !draft.trim() || !canComment}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--navy-950)] disabled:opacity-40"
                    whileHover={{ scale: stance && draft.trim() && canComment ? 1.03 : 1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Post
                  </motion.button>
                </div>
              </form>

              <div className="mb-4 flex flex-wrap gap-2">
                {['top', 'new', 'controversial'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSort(post.id, s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                      (detail?.sort || 'top') === s
                        ? 'text-[var(--text)] ring-[var(--navy-400)]'
                        : 'text-[var(--muted)] ring-[var(--border)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <ul className="space-y-4">
                {comments.map((c) => (
                  <CommentBlock
                    key={c.id}
                    c={c}
                    depth={0}
                    onReply={(pid) => {
                      setReplyTo(pid)
                      setStance(stance || 'Neutral')
                    }}
                    onVote={(cid, d) => handleVote(post.id, cid, d, voteComment, recordVoteGiven)}
                  />
                ))}
              </ul>
            </div>
          )}

          {tab === 'sources' && (
            <ul className="space-y-3">
              {sourcesList.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--navy-900)] p-3"
                >
                  <span className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-[var(--navy-800)] text-center text-xs leading-8 text-[var(--muted)]">
                    {(s.domain || 'link').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[var(--navy-400)] hover:underline"
                    >
                      {s.title}
                    </a>
                    <p className="text-xs text-[var(--muted)]">{s.domain}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function CommentBlock({ c, depth, onReply, onVote }) {
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--navy-900)]/80 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-medium text-[var(--text)]">{c.username}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${stancePill(c.stance)}`}>
          {c.stance}
        </span>
        <span className="ml-auto text-xs text-[var(--muted)]">
          {new Date(c.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-[var(--text)]/90">{c.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
        <button type="button" className="hover:text-[var(--text)]" onClick={() => onVote(c.id, 1)}>
          ↑ {c.upvotes || 0}
        </button>
        <button type="button" className="hover:text-[var(--text)]" onClick={() => onVote(c.id, -1)}>
          ↓ {c.downvotes || 0}
        </button>
        {depth === 0 && (
          <button type="button" className="text-[var(--navy-400)] hover:underline" onClick={() => onReply(c.id)}>
            Reply
          </button>
        )}
      </div>
      {c.replies?.length > 0 && (
        <ul className="mt-4 space-y-3 border-l border-[var(--border)] pl-4">
          {c.replies.map((r) => (
            <CommentBlock key={r.id} c={r} depth={1} onReply={() => {}} onVote={onVote} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function DiscussionPage() {
  const { id } = useParams()
  const location = useLocation()
  if (!id) return null
  const preferred = location.state?.preferredStance ?? null
  return (
    <DiscussionPageInner key={`${id}-${preferred || 'none'}`} id={id} preferredStance={preferred} />
  )
}
