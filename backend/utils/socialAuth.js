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
