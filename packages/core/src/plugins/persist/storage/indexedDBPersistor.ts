import type { PersistedClient, Persistor } from '../createPersistor'

export interface IndexedDBPersistorOptions {
  dbName?: string
  storeName?: string
  key?: string
}

/**
 * Creates an IndexedDB persistor for storing query cache data.
 * IndexedDB provides larger storage capacity than localStorage and is async by nature.
 */
export function createIndexedDBPersistor(options: IndexedDBPersistorOptions = {}): Persistor {
  const dbName = options.dbName ?? 'mfestack-query-cache'
  const storeName = options.storeName ?? 'cache'
  const key = options.key ?? 'query-client'

  let dbPromise: Promise<IDBDatabase> | null = null

  const getDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise

    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available'))
        return
      }

      const request = indexedDB.open(dbName, 1)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }
    })

    return dbPromise
  }

  return {
    async persistClient(data: unknown): Promise<void> {
      try {
        const db = await getDB()
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        await new Promise<void>((resolve, reject) => {
          const request = store.put(data, key)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      } catch (error) {
        console.warn('Failed to persist to IndexedDB:', error)
        throw error
      }
    },

    async restoreClient(): Promise<PersistedClient | undefined> {
      try {
        const db = await getDB()
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        
        return new Promise<PersistedClient | undefined>((resolve, reject) => {
          const request = store.get(key)
          request.onsuccess = () => {
            const result = request.result
            resolve(result ? (result as PersistedClient) : undefined)
          }
          request.onerror = () => reject(request.error)
        })
      } catch (error) {
        console.warn('Failed to restore from IndexedDB:', error)
        return undefined
      }
    },

    async removeClient(): Promise<void> {
      try {
        const db = await getDB()
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(key)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      } catch (error) {
        console.warn('Failed to remove from IndexedDB:', error)
      }
    },
  }
}

