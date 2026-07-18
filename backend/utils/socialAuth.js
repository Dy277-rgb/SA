import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

/**
 * Verifies a Google ID token (the `credential` returned by Google Identity
 * Services in the browser) and returns the verified profile. Throws if the
 * token is invalid, expired, or issued for a different client ID — this
 * check must happen server-side; never trust a decoded-but-unverified JWT
 * from the client.
 */
export async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  return {
    providerId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || null,
  }
}

/**
 * Verifies a Facebook access token by asking Facebook's Graph API for the
 * profile it belongs to — if the token were forged, this call fails.
 */
export async function verifyFacebookToken(accessToken) {
  const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Facebook token verification failed')
  }
  const data = await res.json()
  if (!data.id) throw new Error('Facebook token verification failed')

  return {
    providerId: data.id,
    email: data.email || `fb${data.id}@skylane.facebook`, // Facebook can withhold email if the user denies that permission
    name: data.name || 'Facebook User',
    avatar: data.picture?.data?.url || null,
  }
}

/**
 * Verifies the payload from the Telegram Login Widget using the official
 * HMAC-SHA256 check described in Telegram's Login Widget docs:
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(data) {
  const { hash, ...fields } = data

  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN.trim()).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  if (computedHash !== hash) {
    throw new Error('Invalid Telegram login signature')
  }

  const authAge = Date.now() / 1000 - Number(fields.auth_date)
  if (authAge > 86400) {
    throw new Error('Telegram login has expired, please try again')
  }

  return {
    providerId: String(fields.id),
    name: [fields.first_name, fields.last_name].filter(Boolean).join(' ') || fields.username || 'Telegram User',
    avatar: fields.photo_url || null,
  }
}
