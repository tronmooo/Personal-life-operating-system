// A tiny IndexedDB helper used in multiple providers for offline caching

const DB_NAME = 'lifehub-cache'
const STORE = 'kv'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet<T = unknown>(key: string, fallback: T | null = null): Promise<T | null> {
  if (typeof window === 'undefined') return fallback
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.get(key)
    return await new Promise((resolve) => {
      req.onsuccess = () => resolve((req.result as T) ?? fallback)
      req.onerror = () => resolve(fallback)
    })
  } catch {
    return fallback
  }
}

export async function idbSet<T = unknown>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // ignore
  }
}

export async function idbDel(key: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // ignore
  }
}

export async function idbClear(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // ignore
  }
}

export async function idbGetAll(): Promise<Record<string, any>> {
  if (typeof window === 'undefined') return {}
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const keys = await new Promise<string[]>((resolve, reject) => {
      const req = store.getAllKeys()
      req.onsuccess = () => resolve(req.result as string[])
      req.onerror = () => reject(req.error)
    })
    
    const result: Record<string, any> = {}
    for (const key of keys) {
      const value = await idbGet(key)
      result[key] = value
    }
    return result
  } catch {
    return {}
  }
}

export async function idbGetAllKeys(): Promise<string[]> {
  if (typeof window === 'undefined') return []
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.getAllKeys()
    return await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as string[])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}
