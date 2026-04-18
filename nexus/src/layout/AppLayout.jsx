import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppNavbar } from '../components/AppNavbar'
import { DesktopSidebar } from '../components/DesktopSidebar'
import { MenuPanel } from '../components/MenuPanel'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { NewDiscussionModal } from '../components/NewDiscussionModal'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { TrendingPanel } from '../components/TrendingPanel'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFeedStore } from '../stores/feedStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserStore } from '../stores/userStore'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const prependLocalDiscussion = useFeedStore((s) => s.prependLocalDiscussion)
  const recordPostCreated = useUserStore((s) => s.recordPostCreated)
  const initNotifications = useNotificationStore((s) => s.init)
  const isDesktopNav = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    initNotifications()
  }, [initNotifications])

  useEffect(() => {
    if (!isDesktopNav || !menuOpen) return
    queueMicrotask(() => setMenuOpen(false))
  }, [isDesktopNav, menuOpen])

  const anyOverlay = notifOpen || (menuOpen && !isDesktopNav)

  return (
    <div className="flex min-h-svh flex-col pt-14">
      <DesktopSidebar onNewDiscussion={() => setModalOpen(true)} />
      <AppNavbar
        onOpenNotifications={() => {
          setMenuOpen(false)
          setNotifOpen(true)
        }}
        onOpenMenu={() => {
          setNotifOpen(false)
          setMenuOpen(true)
        }}
        onNewDiscussion={() => setModalOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:flex-row lg:pl-56">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className={`mx-auto w-full max-w-[min(40rem,100%)] flex-1 px-4 py-6 sm:px-5 lg:px-8 ${anyOverlay ? '' : 'pb-20'} lg:pb-10`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        <div className="hidden w-[300px] shrink-0 py-6 pr-4 xl:block">
          <div className="sticky top-20">
            <TrendingPanel />
          </div>
        </div>
      </div>

      <MobileBottomNav />

      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <NewDiscussionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          const newId = prependLocalDiscussion(data)
          const title = data.title?.trim() || 'New discussion'
          recordPostCreated({ discussionId: newId, title })
          setModalOpen(false)
          navigate(`/discussion/${newId}`)
        }}
      />
    </div>
  )
}
