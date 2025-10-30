import React, { createContext, useContext, useMemo } from 'react'
import type { QueryClient } from '@mfestack/core'

type Maybe<T> = T | null

export interface QueryClientProviderProps {
  client: QueryClient
  children?: React.ReactNode
}

const QueryClientContext = createContext<Maybe<QueryClient>>(null)

export function QueryClientProvider({ client, children }: QueryClientProviderProps) {
  const value = useMemo(() => client, [client])
  return <QueryClientContext.Provider value={value}>{children}</QueryClientContext.Provider>
}

export function useQueryClient(): QueryClient {
  const ctx = useContext(QueryClientContext)
  if (!ctx) {
    throw new Error('useQueryClient must be used within a QueryClientProvider')
  }
  return ctx
}


