export interface PersistedClient {
  timestamp: number
  version: number
  data: unknown
}

export interface Persistor {
  persistClient: (client: unknown) => Promise<void>
  restoreClient: () => Promise<PersistedClient | undefined>
  removeClient: () => Promise<void>
}

export function createPersistor(persistor: Persistor): Persistor {
  return persistor
}
