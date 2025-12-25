/**
 * Optional debug telemetry helper.
 *
 * This repo has some legacy debug `fetch('http://127.0.0.1:7242/ingest/...')` calls.
 * When that collector isn't running, the browser console fills with ERR_CONNECTION_REFUSED.
 *
 * We gate all debug ingestion behind `NEXT_PUBLIC_DEBUG_INGEST_URL`.
 */

export type DebugIngestPayload = {
  location: string
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  timestamp?: number
  sessionId?: string
  hypothesisId?: string
}

export function debugIngest(payload: DebugIngestPayload) {
  const url = process.env.NEXT_PUBLIC_DEBUG_INGEST_URL
  if (!url) return
  if (typeof window === 'undefined') return

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: payload.timestamp ?? Date.now(),
      }),
    }).catch(() => {})
  } catch {
    // swallow
  }
}































