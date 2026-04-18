import { getCachedAnalysis, setCachedAnalysis } from './llmCache'
import {
  distributionFromComments,
  roughCivilityFromComments,
  scoreCommentStance,
} from './sentiment'

function localAnalysis(topic, comments) {
  const top = comments.slice(0, 20)
  const forSnips = top
    .filter((c) => scoreCommentStance(c.body || c.text) === 'for')
    .slice(0, 3)
    .map((c) => (c.body || c.text || '').slice(0, 220))
  const againstSnips = top
    .filter((c) => scoreCommentStance(c.body || c.text) === 'against')
    .slice(0, 3)
    .map((c) => (c.body || c.text || '').slice(0, 220))
  const dist = distributionFromComments(top.map((c) => ({ body: c.body || c.text })))
  return {
    for: forSnips.length ? forSnips : ['Proponents emphasize practical benefits seen in pilots and case studies.'],
    against: againstSnips.length
      ? againstSnips
      : ['Critics stress unintended consequences and gaps in enforcement design.'],
    common_ground:
      'Participants largely want clearer facts and fair process—even when they disagree on outcomes.',
    civility_score: roughCivilityFromComments(top.map((c) => ({ body: c.body || c.text }))),
    stance_distribution: dist,
  }
}

export async function analyzeDiscussionWithLLM(postId, topic, comments) {
  const cached = getCachedAnalysis(postId)
  if (cached) return cached

  const sample = comments.slice(0, 20)
  const bodyText = sample.map((c) => `- (${c.score ?? 0}) ${c.body || c.text || ''}`).join('\n')

  const useProxy = import.meta.env.DEV && import.meta.env.VITE_ANTHROPIC_API_KEY
  const url = useProxy
    ? '/anthropic/v1/messages'
    : 'https://api.anthropic.com/v1/messages'

  const payload = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 900,
    messages: [
      {
        role: 'user',
        content: `You are an impartial analyst. Given these comments about "${topic}", extract and return JSON only (no markdown):
{
"for": ["argument 1", "argument 2", "argument 3"],
"against": ["argument 1", "argument 2", "argument 3"],
"common_ground": "one sentence",
"civility_score": 0,
"stance_distribution": { "for": 0, "against": 0, "neutral": 0 }
}
Comments:\n${bodyText || '(no comments)'}`,
      },
    ],
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    }
    if (!useProxy) {
      const key = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (key) headers['x-api-key'] = key
    }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error(String(res.status))
    const json = await res.json()
    const text = json?.content?.[0]?.text || ''
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
    if (parsed.for && parsed.against) {
      setCachedAnalysis(postId, parsed)
      return parsed
    }
  } catch {
    /* fall through */
  }

  const fallback = localAnalysis(topic, sample)
  setCachedAnalysis(postId, fallback)
  return fallback
}
