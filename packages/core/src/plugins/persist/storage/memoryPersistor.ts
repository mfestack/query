import type { PersistedClient, Persistor } from '../createPersistor'

export function createMemoryPersistor(): Persistor {
  let mem: PersistedClient | undefined
  return {
    async persistClient(data: unknown) {
      mem = data as PersistedClient
    },
    async restoreClient(): Promise<PersistedClient | undefined> {
      return mem
    },
    async removeClient() {
      mem = undefined
    },
  }
}
