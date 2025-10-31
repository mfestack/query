/**
 * Adapter utilities for Node.js and Edge runtime compatibility
 * Provides isServer detection and polyfills for browser-only APIs
 */

/**
 * Detect if code is running in a server environment
 */
export const isServer: boolean = typeof window === 'undefined'

/**
 * Detect if code is running in an Edge runtime (Cloudflare Workers, Vercel Edge, etc.)
 */
export const isEdge: boolean =
  (typeof globalThis !== 'undefined' && 
   ('EdgeRuntime' in globalThis || 
    (typeof (globalThis as any).EdgeRuntime !== 'undefined'))) ||
  (typeof globalThis !== 'undefined' && 'Deno' in globalThis) ||
  (typeof navigator !== 'undefined' && navigator.userAgent.includes('Cloudflare'))

/**
 * Detect if code is running in Node.js
 */
export const isNode: boolean =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null

/**
 * Get a fetch implementation compatible with the current environment
 */
export function getFetch(): typeof fetch {
  if (typeof fetch !== 'undefined') {
    return fetch
  }
  
  if (isNode) {
    // Use node-fetch or native Node.js fetch (Node 18+)
    try {
      // @ts-ignore - node-fetch may not have types
      return require('node-fetch')
    } catch {
      // Fallback to global fetch if available (Node 18+)
      if (typeof globalThis.fetch !== 'undefined') {
        return globalThis.fetch
      }
      throw new Error(
        'fetch is not available. Please install node-fetch or use Node.js 18+'
      )
    }
  }
  
  throw new Error('fetch is not available in this environment')
}

/**
 * Get an AbortController implementation compatible with the current environment
 */
export function getAbortController(): typeof AbortController {
  if (typeof AbortController !== 'undefined') {
    return AbortController
  }
  
  if (isNode) {
    try {
      // @ts-ignore
      const { AbortController: NodeAbortController } = require('abort-controller')
      return NodeAbortController
    } catch {
      // Node.js 15+ has native AbortController
      if (typeof globalThis.AbortController !== 'undefined') {
        return globalThis.AbortController
      }
      throw new Error(
        'AbortController is not available. Please install abort-controller or use Node.js 15+'
      )
    }
  }
  
  throw new Error('AbortController is not available in this environment')
}

/**
 * Safe storage access that works in SSR
 */
export function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Safe BroadcastChannel access that works in SSR
 */
export function getBroadcastChannel(channelName: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null
  }
  
  try {
    return new BroadcastChannel(channelName)
  } catch {
    return null
  }
}

/**
 * Safe requestAnimationFrame access that works in SSR
 */
export function requestAnimationFrame(callback: FrameRequestCallback): number {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
    // Fallback to setTimeout in SSR
    return setTimeout(() => callback(Date.now()), 16) as unknown as number
  }
  
  return window.requestAnimationFrame(callback)
}

/**
 * Safe cancelAnimationFrame access that works in SSR
 */
export function cancelAnimationFrame(handle: number): void {
  if (typeof window === 'undefined' || typeof window.cancelAnimationFrame === 'undefined') {
    clearTimeout(handle)
    return
  }
  
  window.cancelAnimationFrame(handle)
}

/**
 * Safe requestIdleCallback access that works in SSR
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (
    typeof window === 'undefined' ||
    typeof window.requestIdleCallback === 'undefined'
  ) {
    // Fallback to setTimeout in SSR
    const timeout = options?.timeout ?? 0
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 5,
      })
    }, timeout) as unknown as number
  }
  
  return window.requestIdleCallback(callback, options)
}

/**
 * Safe cancelIdleCallback access that works in SSR
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window === 'undefined' || typeof window.cancelIdleCallback === 'undefined') {
    clearTimeout(handle)
    return
  }
  
  window.cancelIdleCallback(handle)
}

