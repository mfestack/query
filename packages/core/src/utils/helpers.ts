// Utility functions for AppStack Query
import type { QueryKey, QueryFilters, MutationFilters } from '../types'

// Hash function for query keys
export function hashKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey)
}

// Check if running on server
export function isServer(): boolean {
  return typeof window === 'undefined'
}

// Deep equality check with structural sharing
export function replaceEqualDeep<T>(a: T, b: T): T {
  if (a === b) {
    return a
  }

  if (a == null || b == null) {
    return b
  }

  if (typeof a !== typeof b) {
    return b
  }

  if (typeof a !== 'object') {
    return b
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return b
  }

  if (Array.isArray(a)) {
    const aArray = a as unknown[]
    const bArray = b as unknown[]
    
    if (aArray.length !== bArray.length) {
      return b
    }

    let hasChanges = false
    const newArray = aArray.map((item, index) => {
      const newItem = replaceEqualDeep(item, bArray[index])
      if (newItem !== item) {
        hasChanges = true
      }
      return newItem
    })

    return hasChanges ? (newArray as T) : a
  }

  // Handle objects
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)
  
  if (aKeys.length !== bKeys.length) {
    return b
  }

  let hasChanges = false
  const newObj = {} as T

  for (const key of aKeys) {
    if (!(key in bObj)) {
      return b
    }
    
    const newValue = replaceEqualDeep(aObj[key], bObj[key])
    if (newValue !== aObj[key]) {
      hasChanges = true
    }
    (newObj as Record<string, unknown>)[key] = newValue
  }

  return hasChanges ? newObj : a
}

// Check if error should be thrown
export function shouldThrowError(error: Error): boolean {
  return error != null
}

// No-op function
export function noop(): void {
  // Intentionally empty
}

// Match query by filters
export function matchQuery(query: any, filters: QueryFilters): boolean {
  if (filters.predicate) {
    return filters.predicate(query)
  }

  if (filters.queryKey) {
    if (filters.exact) {
      return JSON.stringify(query.queryKey) === JSON.stringify(filters.queryKey)
    } else {
      return partialMatchKey(query.queryKey, filters.queryKey)
    }
  }

  if (filters.type) {
    const isActive = query.observers && query.observers.length > 0
    if (filters.type === 'active') return isActive
    if (filters.type === 'inactive') return !isActive
  }

  if (filters.stale !== undefined) {
    return query.isStale === filters.stale
  }

  if (filters.fetchStatus) {
    return query.fetchStatus === filters.fetchStatus
  }

  return true
}

// Match mutation by filters
export function matchMutation(mutation: any, filters: MutationFilters): boolean {
  if (filters.predicate) {
    return filters.predicate(mutation)
  }

  if (filters.mutationKey) {
    if (filters.exact) {
      return JSON.stringify(mutation.mutationKey) === JSON.stringify(filters.mutationKey)
    } else {
      return partialMatchKey(mutation.mutationKey, filters.mutationKey)
    }
  }

  return true
}

// Partial key matching
export function partialMatchKey(key1: QueryKey, key2: QueryKey): boolean {
  if (key1.length !== key2.length) {
    return false
  }

  return key1.every((item, index) => {
    const item2 = key2[index]
    if (typeof item === 'object' && typeof item2 === 'object') {
      return JSON.stringify(item) === JSON.stringify(item2)
    }
    return item === item2
  })
}

// Keep previous data utility
export function keepPreviousData<T>(previousData: T | undefined, newData: T | undefined): T | undefined {
  if (newData === undefined) {
    return previousData
  }
  return newData
}

// Skip token for conditional queries
export const skipToken = Symbol('skip')

// Updater function type
export type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput)

// Functional update helper
export function functionalUpdate<TInput, TOutput>(
  updater: Updater<TInput, TOutput>,
  input: TInput
): TOutput {
  return typeof updater === 'function' ? (updater as (input: TInput) => TOutput)(input) : updater
}
