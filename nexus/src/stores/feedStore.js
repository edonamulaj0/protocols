import { create } from 'zustand'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { enrichDiscussion, loadHeadlinesOnce } from '../services/pipeline'
import { fetchInitialMultiSub, fetchSubredditHot, normalizePost } from '../services/reddit'
import { loadCuratedDiscussions } from '../services/staticFeed'

let refreshTimer = null

export const useFeedStore = create((set, get) => ({
  posts: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  afterBySub: {},
  error: null,
  lastRefresh: 0,
  headlines: [],

  setPosts: (posts) => set({ posts }),

  prependLocalDiscussion: (data) => {
    const id = `local-${Date.now()}`
    const post = {
      id,
      source: 'nexus',
      subreddit: 'r/nexus',
      category: data.category,
      title: data.title,
      url: '#',
      score: 1,
      num_comments: 0,
      thumbnail: null,
      imageUrl: `https://picsum.photos/seed/${id}/960/520`,
      createdUtc: Math.floor(Date.now() / 1000),
      stanceDistribution: { for: 34, against: 33, neutral: 33 },
      civility: 78,
      bothSides: {
        for: [
          data.description
            ? `Author (${data.stance}): ${data.description.slice(0, 200)}`
            : 'Opening position recorded — invite counter-evidence.',
        ],
        against: [
          'Counter-arguments will appear as the thread attracts diverse readers.',
        ],
        common_ground: 'Structured disagreement starts with shared definitions and good-faith reading.',
        stance_distribution: { for: 34, against: 33, neutral: 33 },
      },
      sources: [
        {
          type: 'nexus',
          title: 'Locally authored topic',
          url: '#',
          domain: 'nexus.local',
        },
      ],
      redditComments: [],
      tweets: [],
    }
    set({ posts: [post, ...get().posts] })
    return id
  },

  bootstrap: async () => {
    set({ loading: true, error: null })

    const curated = await loadCuratedDiscussions()
    if (curated?.length) {
      set({
        posts: curated,
        loading: false,
        hasMore: false,
        afterBySub: {},
        lastRefresh: Date.now(),
        headlines: [],
      })
      get()._clearRefresh()
      return
    }

    const headlines = await loadHeadlinesOnce()
    set({ headlines })
    let posts = []
    try {
      posts = await fetchInitialMultiSub({ perSub: 6 })
    } catch (e) {
      set({ error: String(e.message || e) })
    }
    if (!posts.length) {
      set({
        posts: MOCK_DISCUSSIONS.map((p) => ({ ...p, sources: [...p.sources] })),
        loading: false,
        hasMore: false,
        lastRefresh: Date.now(),
      })
    } else {
      set({
        posts,
        loading: false,
        hasMore: true,
        afterBySub: {},
        lastRefresh: Date.now(),
      })
    }

    get()._clearRefresh()
    refreshTimer = window.setInterval(() => {
      get().refreshTrending()
    }, 10 * 60 * 1000)

    const top = get()
      .posts.slice(0, 5)
      .filter((p) => p.source === 'reddit' && p.redditId)
    await Promise.all(
      top.map((p) =>
        enrichDiscussion(p, headlines).catch(() => {
          /* keep partial */
        }),
      ),
    )
    set({ posts: [...get().posts] })
  },

  _clearRefresh: () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  },

  refreshTrending: async () => {
    if (get().posts[0]?.source === 'curated') return
    set({ lastRefresh: Date.now() })
    const headlines = get().headlines.length ? get().headlines : await loadHeadlinesOnce()
    if (!get().headlines.length) set({ headlines })
    try {
      const fresh = await fetchInitialMultiSub({ perSub: 4 })
      if (!fresh.length) return
      const seen = new Set(get().posts.map((p) => p.id))
      const merged = [...fresh.filter((p) => !seen.has(p.id)), ...get().posts].slice(0, 40)
      set({ posts: merged })
    } catch {
      /* ignore */
    }
  },

  loadMore: async () => {
    const { loadingMore, hasMore, posts, afterBySub } = get()
    if (loadingMore || !hasMore) return
    if (posts[0]?.source === 'nexus' || posts[0]?.source === 'curated') {
      set({ hasMore: false })
      return
    }
    set({ loadingMore: true })
    try {
      const sub = 'politics'
      const after = afterBySub[sub] ?? null
      const { children, after: nextAfter } = await fetchSubredditHot(sub, {
        limit: 10,
        after,
      })
      const mapped = children.map((ch) => normalizePost(ch, sub)).filter(Boolean)
      const ids = new Set(get().posts.map((p) => p.id))
      const appended = mapped.filter((p) => p && !ids.has(p.id))
      set({
        posts: [...get().posts, ...appended],
        afterBySub: { ...get().afterBySub, [sub]: nextAfter },
        hasMore: Boolean(nextAfter),
        loadingMore: false,
      })
    } catch {
      set({ hasMore: false, loadingMore: false })
    }
  },
}))
