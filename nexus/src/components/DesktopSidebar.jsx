import { IoHomeOutline, IoCompassOutline, IoPersonOutline, IoInformationCircleOutline } from 'react-icons/io5'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogoMark } from './LogoMark'
import { useUserStore } from '../stores/userStore'

const linkBase =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--navy-900)] hover:text-[var(--text)]'

function navActive({ isActive }) {
  return `${linkBase} ${isActive ? 'bg-[var(--navy-900)] text-[var(--accent)]' : ''}`
}

export function DesktopSidebar({ onNewDiscussion }) {
  const navigate = useNavigate()
  const googleSub = useUserStore((s) => s.googleSub)
  const signOut = useUserStore((s) => s.signOut)

  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-[55] hidden w-56 flex-col border-r border-[var(--border)] bg-[var(--navy-950)] pt-4 lg:flex"
      aria-label="Main navigation"
    >
      <div className="border-b border-[var(--border)] px-4 pb-4">
        <LogoMark className="scale-95 origin-left" />
        <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">Civil discourse, calmer canvas.</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
        <NavLink to="/" end className={navActive}>
          <IoHomeOutline className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          Home
        </NavLink>
        <NavLink to="/explore" className={navActive}>
          <IoCompassOutline className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          Explore
        </NavLink>
        <NavLink to="/profile/me" className={navActive}>
          <IoPersonOutline className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          Profile
        </NavLink>
        <NavLink to="/about" className={navActive}>
          <IoInformationCircleOutline className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          About
        </NavLink>
      </nav>

      <div className="mt-auto space-y-2 border-t border-[var(--border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onNewDiscussion}
          className="accent-glow-hover w-full rounded-xl bg-[var(--accent)] py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--navy-950)]"
        >
          New discussion
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/terms')}
            className="flex-1 rounded-lg border border-[var(--border)] py-2 text-[11px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--navy-400)]/40"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => navigate('/privacy')}
            className="flex-1 rounded-lg border border-[var(--border)] py-2 text-[11px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--navy-400)]/40"
          >
            Privacy
          </button>
        </div>
        {googleSub ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-lg border border-[var(--border)] py-2 text-[11px] font-semibold text-[var(--muted)] transition-colors hover:border-rose-500/40 hover:text-rose-200"
          >
            Sign out of Google
          </button>
        ) : null}
      </div>
    </aside>
  )
}
