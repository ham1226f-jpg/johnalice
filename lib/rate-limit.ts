import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests per interval
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (request: NextRequest, identifier?: string): { success: boolean; limit: number; remaining: number; reset: number } => {
      // Use provided identifier or fall back to IP
      const id = identifier || 
        request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        'unknown'
      
      const key = `${id}`
      const now = Date.now()
      
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + config.interval
        }
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: store[key].resetTime
        }
      }
      
      store[key].count++
      
      const success = store[key].count <= config.maxRequests
      const remaining = Math.max(0, config.maxRequests - store[key].count)
      
      return {
        success,
        limit: config.maxRequests,
        remaining,
        reset: store[key].resetTime
      }
    }
  }
}

// Predefined rate limiters
export const loginRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per 15 minutes
})

export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
})

export const strictApiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 requests per minute for sensitive endpoints
})
