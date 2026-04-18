import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useUserStore } from '../stores/userStore'
import { useScrollLock } from '../hooks/useScrollLock'

function toIsoLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AuthGate() {
  const googleSub = useUserStore((s) => s.googleSub)
  const birthDate = useUserStore((s) => s.birthDate)
  const profileAge = useUserStore((s) => s.getProfileAge())
  const setGoogleProfileFromJwt = useUserStore((s) => s.setGoogleProfileFromJwt)
  const setBirthDate = useUserStore((s) => s.setBirthDate)
  const [dobDraft, setDobDraft] = useState('')
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated())

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const { dobMin, dobMax } = useMemo(() => {
    const today = new Date()
    const max = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    const min = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    return { dobMin: toIsoLocalDate(min), dobMax: toIsoLocalDate(max) }
  }, [])

  useEffect(() => {
    if (hydrated) return undefined
    return useUserStore.persist.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- prefill DOB draft after hydrate */
    if (birthDate) setDobDraft(birthDate)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [birthDate])

  const needsGoogle = !googleSub?.trim()
  const needsDob = googleSub?.trim() && profileAge == null
  const open = hydrated && Boolean(clientId) && (needsGoogle || needsDob)
  const missingClient = hydrated && !clientId

  useScrollLock(open || missingClient)

  const dobOk = dobDraft >= dobMin && dobDraft <= dobMax

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
                Use Google to continue. We read your name and email from the sign-in token and keep them only in this browser. Google’s default
                sign-in does not include birthday or age—after sign-in you’ll enter your date of birth once; it stays on this device and is kept
                when you sign out of Google so you are not asked again.
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
        {open && needsDob && (
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
              aria-labelledby="dob-gate-title"
            >
              <h2 id="dob-gate-title" className="font-heading text-2xl font-semibold text-[var(--text)]">
                Date of birth
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Saved only in this browser. We use it to verify you’re at least 13 and to show your age on your profile; it is not sent to Google.
                If you already saved a birthday on this device, it is reused after you sign in again.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Birthday
              </label>
              <input
                type="date"
                min={dobMin}
                max={dobMax}
                value={dobDraft}
                onChange={(e) => setDobDraft(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--navy-900)] px-3 py-3 text-[var(--text)] outline-none focus:border-[var(--navy-400)]/45"
              />
              <motion.button
                type="button"
                disabled={!dobOk}
                className="accent-glow-hover mt-5 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--navy-950)] disabled:cursor-not-allowed disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!dobOk) return
                  setBirthDate(dobDraft)
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
