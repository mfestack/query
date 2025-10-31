import { useEffect, useState, useCallback, useMemo } from 'react'
import type { QueryClient } from '@mfestack/core'
import { AppStackDevtoolsCore, type DevtoolsCoreState } from '@mfestack/devtools-core'

export interface DevToolsState extends DevtoolsCoreState {}

export function useDevTools(client: QueryClient) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'queries' | 'mutations' | 'cache' | 'events'>('queries')
  const [state, setState] = useState<DevtoolsCoreState>({
    queries: [],
    mutations: [],
    events: [],
  })

  const core = useMemo(() => new AppStackDevtoolsCore(client), [client])

  useEffect(() => {
    const unsub = core.subscribe(setState)
    return unsub
  }, [core])

  const refetchQuery = useCallback((queryKey: string) => {
    core.refetchQuery(JSON.parse(queryKey))
  }, [core])

  const invalidateQuery = useCallback((queryKey: string) => {
    core.invalidateQuery(JSON.parse(queryKey))
  }, [core])

  const removeQuery = useCallback((queryKey: string) => {
    core.removeQuery(JSON.parse(queryKey))
  }, [core])

  const clearCache = useCallback(() => {
    core.clearCache()
  }, [core])

  return {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    state,
    actions: {
      refetchQuery,
      invalidateQuery,
      removeQuery,
      clearCache,
    },
  }
}

