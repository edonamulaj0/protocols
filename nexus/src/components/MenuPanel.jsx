import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import { IoHomeOutline, IoCompassOutline, IoPersonOutline, IoInformationCircleOutline } from 'react-icons/io5'
import { NavLink } from 'react-router-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useUserStore } from '../stores/userStore'

const navClass =
  'rounded-xl px-8 py-4 text-center font-heading text-2xl font-semibold tracking-tight text-[var(--text)] transition-colors hover:text-[var(--accent)]'

const bottomIconClass =
  'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]'

export function MenuPanel({ open, onClose }) {
  const googleSub = useUserStore((s) => s.googleSub)
  const signOut = useUserStore((s) => s.signOut)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  useScrollLock(open && !isDesktop)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex flex-col bg-[var(--navy-950)] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-[var(--border)] px-4">
            <span className="font-heading text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              Menu
            </span>
            <motion.button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--navy-900)]"
              aria-label="Close menu"
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineX className="h-7 w-7" />
            </motion.button>
          </div>

          <nav className="flex flex-1 flex-col justify-evenly px-6 py-8">
            <NavLink to="/" end className={navClass} onClick={onClose}>
              Home
            </NavLink>
            <NavLink to="/explore" className={navClass} onClick={onClose}>
              Explore
            </NavLink>
            <NavLink to="/profile/me" className={navClass} onClick={onClose}>
              Profile
            </NavLink>
          </nav>

          {googleSub ? (
            <div className="shrink-0 border-t border-[var(--border)] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  signOut()
                  onClose()
                }}
                className="w-full rounded-xl border border-[var(--border)] py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] transition-colors hover:border-rose-500/40 hover:text-rose-200"
              >
                Sign out of Google
              </button>
            </div>
          ) : null}

          <div className="mt-auto border-t border-[var(--border)] px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-md justify-between py-2">
              <NavLink to="/" end className={bottomIconClass} onClick={onClose}>
                <IoHomeOutline className="h-7 w-7 text-[var(--text)]" />
                Home
              </NavLink>
              <NavLink to="/explore" className={bottomIconClass} onClick={onClose}>
                <IoCompassOutline className="h-7 w-7 text-[var(--text)]" />
                Explore
              </NavLink>
              <NavLink to="/profile/me" className={bottomIconClass} onClick={onClose}>
                <IoPersonOutline className="h-7 w-7 text-[var(--text)]" />
                Profile
              </NavLink>
              <NavLink to="/about" className={bottomIconClass} onClick={onClose}>
                <IoInformationCircleOutline className="h-7 w-7 text-[var(--text)]" />
                About
              </NavLink>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
