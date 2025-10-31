import type { PersistedClient, Persistor } from '../createPersistor'

export interface LocalStoragePersistorOptions {
  key?: string
  storage?: Storage
}

export function createLocalStoragePersistor(options: LocalStoragePersistorOptions = {}): Persistor {
  const key = options.key ?? 'mfestack-cache'
  const storage = options.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)

  return {
    async persistClient(data: unknown) {
      if (!storage) return
      storage.setItem(key, JSON.stringify(data))
    },
    async restoreClient(): Promise<PersistedClient | undefined> {
      if (!storage) return undefined
      const raw = storage.getItem(key)
      if (!raw) return undefined
      try {
        return JSON.parse(raw) as PersistedClient
      } catch {
        return undefined
      }
    },
    async removeClient() {
      if (!storage) return
      storage.removeItem(key)
    },
  }
}
