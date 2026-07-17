import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME

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
  const telegramContainerRef = useRef(null)
  const [fbReady, setFbReady] = useState(false)

  async function handleSocialResult(provider, payload) {
    const res = await socialLogin(provider, payload)
    if (res.success) {
      navigate('/dashboard')
    } else {
      onError?.(res.message)
    }
  }

  // ---------- Google ----------
  useEffect(() => {
    if (!isConfigured(GOOGLE_CLIENT_ID)) return

    let cancelled = false
    loadScript('https://accounts.google.com/gsi/client', 'google-identity-script').then(() => {
      if (cancelled || !window.google) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => handleSocialResult('google', { credential: response.credential }),
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

  // ---------- Facebook ----------
  useEffect(() => {
    if (!isConfigured(FACEBOOK_APP_ID)) return

    let cancelled = false
    loadScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk').then(() => {
      if (cancelled || !window.FB) return
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v20.0' })
      setFbReady(true)
    }).catch(() => onError?.('Could not load Facebook sign-in.'))

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFacebookLogin() {
    if (!window.FB) return
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          handleSocialResult('facebook', { accessToken: response.authResponse.accessToken })
        } else {
          onError?.('Facebook sign-in was cancelled.')
        }
      },
      { scope: 'public_profile,email' }
    )
  }

  // ---------- Telegram ----------
  useEffect(() => {
    if (!isConfigured(TELEGRAM_BOT_USERNAME) || !telegramContainerRef.current) return

    window.onTelegramAuth = (user) => handleSocialResult('telegram', user)

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    telegramContainerRef.current.innerHTML = ''
    telegramContainerRef.current.appendChild(script)

    return () => { delete window.onTelegramAuth }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const anyConfigured = isConfigured(GOOGLE_CLIENT_ID) || isConfigured(FACEBOOK_APP_ID) || isConfigured(TELEGRAM_BOT_USERNAME)
  if (!anyConfigured) return null

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-light">
        <span className="h-px flex-1 bg-slate-light/30" />
        or continue with
        <span className="h-px flex-1 bg-slate-light/30" />
      </div>

      <div className="flex flex-col items-center gap-3">
        {isConfigured(GOOGLE_CLIENT_ID) && <div ref={googleButtonRef} />}

        {isConfigured(FACEBOOK_APP_ID) && (
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={!fbReady}
            className="flex w-full max-w-[320px] items-center justify-center gap-2 rounded-lg bg-[#1877F2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166FE5] disabled:opacity-50"
          >
            Continue with Facebook
          </button>
        )}

        {isConfigured(TELEGRAM_BOT_USERNAME) && <div ref={telegramContainerRef} />}
      </div>
    </div>
  )
}
