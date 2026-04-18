/**
 * Curated feed produced by `npm run fetch-discussions` → public/discussions.json
 */
export async function loadCuratedDiscussions() {
  try {
    const res = await fetch('/discussions.json', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return data.map((row) => ({
      ...row,
      sources: Array.isArray(row.sources) ? row.sources : [],
      redditComments: row.redditComments ?? [],
      tweets: row.tweets ?? [],
    }))
  } catch {
    return null
  }
}
