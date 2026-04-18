import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-heading text-3xl font-semibold text-[var(--text)]">About Nexus</h1>
      <p className="mt-4 text-[var(--muted)]">
        Nexus is a civil-discourse reader: structured threads, both-sides summaries, and a calm
        editorial layout. You sign in with Google; we keep your name, email, and the birthday you enter only in your browser for comments and your
        profile (birthday stays on this device after you sign out of Google). No Nexus server account.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        Discussions may come from a static curated file produced by a daily script, or from demo
        data when that file is empty.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/terms"
          className="inline-flex justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--navy-400)]/40"
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className="inline-flex justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--navy-400)]/40"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
