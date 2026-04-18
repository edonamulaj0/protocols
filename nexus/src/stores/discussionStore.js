import { create } from 'zustand'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { useFeedStore } from './feedStore'

const LS_COMMENTS = 'nexus_thread_comments_'

function loadThread(id) {
  try {
    const raw = localStorage.getItem(LS_COMMENTS + id)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveThread(id, comments) {
  try {
    localStorage.setItem(LS_COMMENTS + id, JSON.stringify(comments))
  } catch {
    /* */
  }
}

export const useDiscussionStore = create((set, get) => ({
  currentId: null,
  /** @type {Record<string, any>} */
  detailById: {},
  tab: 'sides',

  setTab: (tab) => set({ tab }),

  hydrateFromFeed: (id) => {
    const feed = useFeedStore.getState().posts
    const post =
      feed.find((p) => p.id === id) ||
      feed.find((p) => p.id === decodeURIComponent(id)) ||
      MOCK_DISCUSSIONS.find((p) => p.id === id)
    if (!post) return null
    const saved = loadThread(post.id)
    const baseComments = saved || seedComments()
    set({
      currentId: post.id,
      tab: 'sides',
      detailById: {
        ...get().detailById,
        [post.id]: {
          post,
          comments: baseComments,
          sort: 'top',
        },
      },
    })
    return post
  },

  addComment: (discussionId, { text, stance, username, parentId = null }) => {
    const row = get().detailById[discussionId]
    if (!row) return
    const id = `c-${Date.now()}`
    const comment = {
      id,
      username,
      stance,
      text,
      upvotes: 1,
      downvotes: 0,
      createdAt: Date.now(),
      replies: [],
    }
    let comments = [...row.comments]
    if (parentId) {
      comments = comments.map((c) => {
        if (c.id !== parentId) return c
        return { ...c, replies: [...(c.replies || []), { ...comment, id: id + '-r' }] }
      })
    } else {
      comments = [comment, ...comments]
    }
    const next = { ...row, comments }
    set({ detailById: { ...get().detailById, [discussionId]: next } })
    saveThread(discussionId, comments)
  },

  voteComment: (discussionId, commentId, delta) => {
    const row = get().detailById[discussionId]
    if (!row) return
    const bump = (c) => {
      if (c.id === commentId) {
        if (delta > 0) return { ...c, upvotes: (c.upvotes || 0) + 1 }
        return { ...c, downvotes: (c.downvotes || 0) + 1 }
      }
      if (c.replies?.length) {
        return { ...c, replies: c.replies.map(bump) }
      }
      return c
    }
    const comments = row.comments.map(bump)
    const next = { ...row, comments }
    set({ detailById: { ...get().detailById, [discussionId]: next } })
    saveThread(discussionId, comments)
  },

  setSort: (discussionId, sort) => {
    const row = get().detailById[discussionId]
    if (!row) return
    set({
      detailById: {
        ...get().detailById,
        [discussionId]: { ...row, sort },
      },
    })
  },

  sortedComments: (discussionId) => {
    const row = get().detailById[discussionId]
    if (!row) return []
    const list = [...row.comments]
    if (row.sort === 'new') list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    else if (row.sort === 'controversial')
      list.sort((a, b) => {
        const ca = Math.abs((a.upvotes || 0) - (a.downvotes || 0))
        const cb = Math.abs((b.upvotes || 0) - (b.downvotes || 0))
        return ca - cb
      })
    else list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    return list
  },
}))

function seedComments() {
  return [
    {
      id: 'seed-1',
      username: 'thread_bot',
      stance: 'Neutral',
      text: 'Opening balance: read sources before replying. Nexus is a client-only MVP.',
      upvotes: 12,
      downvotes: 0,
      createdAt: Date.now() - 3600000,
      replies: [],
    },
  ]
}
