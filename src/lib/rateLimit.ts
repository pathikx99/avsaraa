/**
 * In-Memory Sliding-Window Rate Limiter
 * Enforces brute-force defense across authentication, OTP, coupons, and tracking.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000);

  if (timer.unref) {
    timer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (record.count >= maxAttempts) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  record.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetSeconds,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// Specialized Rate Limit Helpers
export function rateLimitOtpSend(phoneOrEmail: string): RateLimitResult {
  return checkRateLimit(`otp-send:${phoneOrEmail.toLowerCase().trim()}`, 3, 300);
}

export function rateLimitOtpVerify(phoneOrEmail: string): RateLimitResult {
  return checkRateLimit(`otp-verify:${phoneOrEmail.toLowerCase().trim()}`, 5, 300);
}

export function rateLimitCustomerLogin(ip: string): RateLimitResult {
  return checkRateLimit(`customer-login:${ip}`, 5, 900);
}

export function rateLimitCouponValidation(ip: string): RateLimitResult {
  return checkRateLimit(`coupon-validate:${ip}`, 15, 60);
}

export function rateLimitOrderTracking(ip: string): RateLimitResult {
  return checkRateLimit(`order-track:${ip}`, 10, 60);
}
