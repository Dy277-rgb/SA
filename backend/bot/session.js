// Simple in-memory session store keyed by Telegram chat ID.
// Good enough for a single-process bot; swap for Redis if you scale to
// multiple instances.
const sessions = new Map()

export function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { step: 'idle', data: {} })
  }
  return sessions.get(chatId)
}

export function resetSession(chatId) {
  sessions.set(chatId, { step: 'idle', data: {} })
}

export function setStep(chatId, step) {
  getSession(chatId).step = step
}

export function updateData(chatId, patch) {
  const session = getSession(chatId)
  session.data = { ...session.data, ...patch }
}
