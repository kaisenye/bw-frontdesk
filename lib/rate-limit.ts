/**
 * A small fixed-window limiter for the public demo.
 *
 * Honest about what this is: state lives in the memory of one serverless
 * instance, so a burst spread across instances gets a higher effective ceiling
 * than the numbers here, and a cold start forgets everything. That is the right
 * trade for a demo. The job is to stop one script from running up a bill, not to
 * enforce a quota. A real deployment would keep the counter in Redis or Vercel
 * KV so it is shared, and would key on the authenticated family rather than IP.
 */

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()

/** Keeps the map bounded on a long-lived instance. */
const MAX_TRACKED_KEYS = 5000

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the window resets. Sent as Retry-After when blocked. */
  retryAfter: number
  remaining: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      // Drop everything already expired, and if that frees nothing, drop the
      // oldest single entry so the map can never grow without bound.
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k)
      }
      if (buckets.size >= MAX_TRACKED_KEYS) {
        const oldest = buckets.keys().next().value
        if (oldest !== undefined) buckets.delete(oldest)
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0, remaining: limit - 1 }
  }

  existing.count += 1
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  if (existing.count > limit) {
    return { ok: false, retryAfter, remaining: 0 }
  }
  return { ok: true, retryAfter, remaining: limit - existing.count }
}

/**
 * Best-effort client identity. Vercel sets x-forwarded-for and the leftmost
 * entry is the client. Spoofable, which is another reason this is a speed bump
 * rather than a security control.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
