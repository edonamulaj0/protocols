const PREFIX = 'nexus_llm_'

export function getCachedAnalysis(postId) {
  try {
    const raw = localStorage.getItem(PREFIX + postId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedAnalysis(postId, payload) {
  try {
    localStorage.setItem(PREFIX + postId, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}
