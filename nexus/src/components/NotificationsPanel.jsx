import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useNotificationStore } from '../stores/notificationStore'

export function NotificationsPanel({ open, onClose }) {
  const navigate = useNavigate()
  const items = useNotificationStore((s) => s.items)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  useScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex flex-col bg-[var(--navy-950)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <div className="relative flex h-14 shrink-0 items-center border-b border-[var(--border)] px-4">
            <h2 className="flex-1 text-center font-heading text-lg font-semibold text-[var(--text)]">
              Notifications
            </h2>
            <motion.button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--text)] transition-colors hover:bg-[var(--navy-900)]"
              aria-label="Close notifications"
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineX className="h-7 w-7" />
            </motion.button>
          </div>
          <div className="flex justify-center border-b border-[var(--border)] py-2">
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-sm font-semibold text-[var(--navy-400)] hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {items.map((n) => (
              <li key={n.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    markRead(n.id)
                    onClose()
                    navigate(`/discussion/${n.discussionId}`)
                  }}
                  className="flex w-full gap-3 rounded-xl border border-transparent p-4 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--surface)]"
                >
                  <span className="text-2xl" aria-hidden>
                    {n.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">{n.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{n.body}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                      {new Date(n.at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--navy-400)]" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
