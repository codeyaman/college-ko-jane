type RateLimitInfo = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitInfo>();

/**
 * Rate limit requests based on IP address.
 *
 * @param ip Client IP address.
 * @param limit Max requests allowed in the time window.
 * @param windowMs Time window in milliseconds.
 * @returns true if allowed, false if rate limited.
 */
export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const info = rateLimitMap.get(ip);

  if (!info || info.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (info.count >= limit) {
    return false; // Rate limited
  }

  info.count += 1;
  return true;
}

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of rateLimitMap.entries()) {
    if (info.resetTime < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 15 * 60 * 1000).unref();
