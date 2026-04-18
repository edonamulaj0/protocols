import { useFeedStore } from '../stores/feedStore'
import { InfiniteScrollFeed } from '../components/InfiniteScrollFeed'
import { SkeletonCard } from '../components/SkeletonCard'

export function HomePage() {
  const loading = useFeedStore((s) => s.loading)
  const posts = useFeedStore((s) => s.posts)

  if (loading && !posts.length) {
    return (
      <div className="flex flex-col gap-7">
        <header className="mb-2">
          <h1 className="font-heading text-3xl font-semibold text-[var(--text)]">Today&apos;s debates</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Pulling live threads from Reddit, cross-checking headlines, and summarizing both
            sides—stay skeptical, stay kind.
          </p>
        </header>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-[var(--text)]">Today&apos;s debates</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Substack-style cards on a calmer canvas. Data may fall back to curated mocks when APIs
          block the browser.
        </p>
      </header>
      <InfiniteScrollFeed posts={posts} />
    </div>
  )
}
