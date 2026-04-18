import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useUserStore } from '../stores/userStore'
import { useScrollLock } from '../hooks/useScrollLock'

export function AuthGate() {
  const googleSub = useUserStore((s) => s.googleSub)
  const age = useUserStore((s) => s.age)
  const setGoogleProfileFromJwt = useUserStore((s) => s.setGoogleProfileFromJwt)
  const setAge = useUserStore((s) => s.setAge)
  const [ageDraft, setAgeDraft] = useState('')
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated())

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (hydrated) return undefined
    return useUserStore.persist.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- prefill age draft after hydrate */
    if (age != null) setAgeDraft(String(age))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [age])

  const needsGoogle = !googleSub?.trim()
  const needsAge = googleSub?.trim() && (age == null || age < 13 || age > 120)
  const open =
    hydrated && Boolean(clientId) && (needsGoogle || needsAge)
  const missingClient = hydrated && !clientId

  useScrollLock(open || missingClient)

  return (
    <>
      <AnimatePresence>
        {missingClient && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              role="alert"
            >
              <h2 className="font-heading text-xl font-semibold text-[var(--text)]">
                Google Sign-In not configured
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                Add <code className="rounded bg-[var(--navy-900)] px-1.5 py-0.5 text-[var(--text)]">VITE_GOOGLE_CLIENT_ID</code> to{' '}
                <code className="rounded bg-[var(--navy-900)] px-1.5 py-0.5 text-[var(--text)]">.env</code> (OAuth 2.0 Web client from Google
                Cloud Console) and restart the dev server. Authorized JavaScript origins should include your app origin (e.g.{' '}
                <code className="rounded bg-[var(--navy-900)] px-1.5 py-0.5">http://localhost:5173</code>).
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && needsGoogle && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-gate-title"
            >
              <h2 id="auth-gate-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                Sign in to Nexus
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Use Google to continue. We read your name and email from the sign-in token and keep them only in this browser. Google does not
                share your age; you will enter it on the next step for local display only.
              </p>
              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={(res) => {
                    if (!res.credential) return
                    try {
                      const payload = jwtDecode(res.credential)
                      setGoogleProfileFromJwt(payload)
                    } catch {
                      // ignore malformed token
                    }
                  }}
                  onError={() => {}}
                  useOneTap={false}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && needsAge && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="age-gate-title"
            >
              <h2 id="age-gate-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                Your age
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Google does not provide age. Enter yours for this device only (comments and profile). We do not send it to Google.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Age
              </label>
              <input
                type="number"
                min={13}
                max={120}
                value={ageDraft}
                onChange={(e) => setAgeDraft(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--navy-900)] px-3 py-3 text-[var(--text)] outline-none focus:border-[var(--navy-400)]/45"
                placeholder="13–120"
              />
              <motion.button
                type="button"
                disabled={
                  !Number.isFinite(Number(ageDraft)) ||
                  Number(ageDraft) < 13 ||
                  Number(ageDraft) > 120
                }
                className="accent-glow-hover mt-5 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--navy-950)] disabled:cursor-not-allowed disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const a = Number(ageDraft)
                  setAge(Number.isFinite(a) && a >= 13 && a <= 120 ? a : null)
                }}
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
