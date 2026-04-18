import { analyzeDiscussionWithLLM } from './anthropic'
import { matchNewsForTitle, fetchTopHeadlines } from './news'
import { fetchPostComments } from './reddit'
import { searchTweetsForTopic } from './twitter'
import { distributionFromComments, roughCivilityFromComments } from './sentiment'

function subName(subreddit) {
  return (subreddit || '').replace(/^r\//, '')
}

export async function enrichDiscussion(post, headlines) {
  if ((post.source === 'nexus' || post.source === 'curated') && post.bothSides?.for?.length) {
    return post
  }
  const sub = subName(post.subreddit)
  let comments = []
  if (post.redditId && sub) {
    try {
      comments = await fetchPostComments(sub, post.redditId)
    } catch {
      comments = []
    }
  }
  post.redditComments = comments
  if (comments.length) {
    post.stanceDistribution = distributionFromComments(
      comments.map((c) => ({ body: c.body })),
    )
    post.civility = roughCivilityFromComments(comments.map((c) => ({ body: c.body })))
  }

  const newsHits = matchNewsForTitle(post.title, headlines)
  for (const n of newsHits) {
    if (!post.sources.some((s) => s.url === n.url)) post.sources.push(n)
  }

  try {
    const tweets = await searchTweetsForTopic(post.title)
    post.tweets = tweets
  } catch {
    post.tweets = []
  }

  const analysis = await analyzeDiscussionWithLLM(post.id, post.title, comments)
  post.bothSides = {
    for: analysis.for || [],
    against: analysis.against || [],
    common_ground: analysis.common_ground || '',
    stance_distribution: analysis.stance_distribution || post.stanceDistribution,
  }
  if (analysis.stance_distribution) {
    post.stanceDistribution = analysis.stance_distribution
  }
  if (typeof analysis.civility_score === 'number') {
    post.civility = analysis.civility_score
  }
  return post
}

export async function loadHeadlinesOnce() {
  try {
    return await fetchTopHeadlines()
  } catch {
    return []
  }
}
