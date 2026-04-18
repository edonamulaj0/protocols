import { HiMenuAlt3, HiOutlineBell } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { LogoMark } from './LogoMark'
import { useNotificationStore } from '../stores/notificationStore'

export function AppNavbar({ onOpenNotifications, onOpenMenu, onNewDiscussion }) {
  const unread = useNotificationStore((s) => s.unreadCount)

  return (
    <header className="fixed left-0 right-0 top-0 z-[60] border-b border-[var(--border)] bg-[var(--navy-950)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <LogoMark />
        <div className="flex flex-1 justify-end items-center gap-2">
          <motion.button
            type="button"
            onClick={onNewDiscussion}
            className="accent-glow-hover hidden rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--navy-950)] sm:inline-flex"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            New
          </motion.button>
          <motion.button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--navy-900)]"
            aria-label="Notifications"
            whileTap={{ scale: 0.95 }}
          >
            <HiOutlineBell className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--accent)] px-0.5 text-[10px] font-bold text-[var(--navy-950)]">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </motion.button>
          <motion.button
            type="button"
            onClick={onOpenMenu}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--navy-900)]"
            aria-label="Open menu"
            whileTap={{ scale: 0.95 }}
          >
            <HiMenuAlt3 className="h-7 w-7" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
