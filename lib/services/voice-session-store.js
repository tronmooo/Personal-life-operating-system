/**
 * Shared in-memory session store for voice calls.
 *
 * Why this exists:
 * - `server.js` runs the Twilio Media Streams WebSocket server and receives live events.
 * - Next.js route handlers (e.g. `GET /api/voice/status`) need read access to live call state.
 *
 * We keep the store on `globalThis` so it is shared within the same Node.js process.
 * Note: This is not durable storage. For production persistence, write to DB.
 */

const GLOBAL_KEY = '__lifehub_voice_sessions__'

function getStore() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = new Map()
  }
  return globalThis[GLOBAL_KEY]
}

/**
 * @typedef {{ speaker: 'ai' | 'human', message: string, timestamp: string }} TranscriptItem
 * @typedef {{
 *   callSid: string,
 *   streamSid?: string,
 *   status?: string,
 *   startTime?: string,
 *   endTime?: string,
 *   context?: any,
 *   transcript?: TranscriptItem[],
 *   quote?: any,
 *   appointment?: any,
 *   endReason?: any,
 *   error?: string
 * }} VoiceSession
 */

function upsertSession(callSid, patch) {
  const store = getStore()
  const existing = store.get(callSid) || { callSid, transcript: [] }
  const next = { ...existing, ...patch, callSid }
  store.set(callSid, next)
  return next
}

function appendTranscript(callSid, item) {
  const store = getStore()
  const existing = store.get(callSid) || { callSid, transcript: [] }
  const transcript = Array.isArray(existing.transcript) ? existing.transcript.slice() : []
  transcript.push(item)
  const next = { ...existing, callSid, transcript }
  store.set(callSid, next)
  return next
}

function getSession(callSid) {
  return getStore().get(callSid)
}

function setStatus(callSid, status) {
  return upsertSession(callSid, { status })
}

function endSession(callSid, patch = {}) {
  return upsertSession(callSid, { status: patch.status || 'completed', endTime: new Date().toISOString(), ...patch })
}

function deleteSession(callSid) {
  return getStore().delete(callSid)
}

module.exports = {
  getSession,
  upsertSession,
  appendTranscript,
  setStatus,
  endSession,
  deleteSession
}


































