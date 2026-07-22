import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

function isConfigured(value) {
  return Boolean(value) && !value.startsWith('your_')
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve()
    const script = document.createElement('script')
    script.src = src
    script.id = id
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

export default function SocialLoginButtons({ onError }) {
  const { socialLogin } = useAuth()
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)

  async function handleGoogleResult(credential) {
    const res = await socialLogin('google', { credential })
    if (res.success) {
      navigate('/dashboard')
    } else {
      onError?.(res.message)
    }
  }

  useEffect(() => {
    if (!isConfigured(GOOGLE_CLIENT_ID)) return

    let cancelled = false
    loadScript('https://accounts.google.com/gsi/client', 'google-identity-script').then(() => {
      if (cancelled || !window.google) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => handleGoogleResult(response.credential),
      })
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline', size: 'large', width: 320, text: 'continue_with',
        })
      }
    }).catch(() => onError?.('Could not load Google sign-in.'))

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDev = import.meta.env.DEV
  if (!isConfigured(GOOGLE_CLIENT_ID) && !isDev) return null

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-light">
        <span className="h-px flex-1 bg-slate-light/30" />
        or continue with
        <span className="h-px flex-1 bg-slate-light/30" />
      </div>

      <div className="flex flex-col items-center gap-3">
        {isConfigured(GOOGLE_CLIENT_ID) ? (
          <div ref={googleButtonRef} />
        ) : (
          isDev && (
            <div className="w-full max-w-[320px] rounded-lg border border-dashed border-slate-light/40 px-3 py-2 text-center text-xs text-slate-light">
              Google sign-in not configured — set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> in{' '}
              <code className="font-mono">frontend/.env</code>. Hidden automatically in production.
            </div>
          )
        )}
      </div>
    </div>
  )
}
