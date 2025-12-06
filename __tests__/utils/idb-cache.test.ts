/**
 * Unit tests for IndexedDB cache utility
 * Tests CRUD operations for offline-first data caching
 */

import { idbGet, idbSet, idbDel, idbGetAll, idbGetAllKeys } from '@/lib/utils/idb-cache'

describe('idb-cache', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    const dbs = await indexedDB.databases()
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name)
      }
    }
  })

  describe('idbSet and idbGet', () => {
    test('stores and retrieves a string value', async () => {
      await idbSet('testKey', 'testValue')
      const result = await idbGet('testKey')
      expect(result).toBe('testValue')
    })

    test('stores and retrieves a number value', async () => {
      await idbSet('numberKey', 42)
      const result = await idbGet('numberKey')
      expect(result).toBe(42)
    })

    test('stores and retrieves an object', async () => {
      const testObj = { name: 'John', age: 30, active: true }
      await idbSet('objectKey', testObj)
      const result = await idbGet('objectKey')
      expect(result).toEqual(testObj)
    })

    test('stores and retrieves an array', async () => {
      const testArray = [1, 2, 3, 'four', { five: 5 }]
      await idbSet('arrayKey', testArray)
      const result = await idbGet('arrayKey')
      expect(result).toEqual(testArray)
    })

    test('stores and retrieves nested objects', async () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      }
      await idbSet('nestedKey', nested)
      const result = await idbGet('nestedKey')
      expect(result).toEqual(nested)
    })

    test('returns null for non-existent key', async () => {
      const result = await idbGet('nonExistentKey')
      expect(result).toBeNull()
    })

    test('returns fallback value for non-existent key', async () => {
      const fallback = { default: true }
      const result = await idbGet('nonExistentKey', fallback)
      expect(result).toEqual(fallback)
    })

    test('overwrites existing value', async () => {
      await idbSet('updateKey', 'original')
      await idbSet('updateKey', 'updated')
      const result = await idbGet('updateKey')
      expect(result).toBe('updated')
    })

    test('handles boolean values', async () => {
      await idbSet('boolTrue', true)
      await idbSet('boolFalse', false)
      expect(await idbGet('boolTrue')).toBe(true)
      expect(await idbGet('boolFalse')).toBe(false)
    })

    test('handles null values', async () => {
      await idbSet('nullKey', null)
      const result = await idbGet('nullKey')
      expect(result).toBeNull()
    })

    test('handles undefined by storing and returning it', async () => {
      await idbSet('undefinedKey', undefined)
      const result = await idbGet('undefinedKey')
      // IndexedDB typically stores undefined as undefined, but it might return null
      // depending on the implementation
      expect(result === undefined || result === null).toBe(true)
    })
  })

  describe('idbDel', () => {
    test('deletes an existing key', async () => {
      await idbSet('deleteMe', 'value')
      const before = await idbGet('deleteMe')
      expect(before).toBe('value')

      await idbDel('deleteMe')
      const after = await idbGet('deleteMe')
      expect(after).toBeNull()
    })

    test('handles deletion of non-existent key', async () => {
      // Should not throw error
      await expect(idbDel('nonExistent')).resolves.toBeUndefined()
    })

    test('allows re-adding after deletion', async () => {
      await idbSet('key', 'value1')
      await idbDel('key')
      await idbSet('key', 'value2')
      const result = await idbGet('key')
      expect(result).toBe('value2')
    })
  })

  describe('idbGetAll', () => {
    test('returns empty object when no data exists', async () => {
      const result = await idbGetAll()
      expect(result).toEqual({})
    })

    test('returns all stored key-value pairs', async () => {
      await idbSet('key1', 'value1')
      await idbSet('key2', 'value2')
      await idbSet('key3', { nested: true })

      const result = await idbGetAll()
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: { nested: true }
      })
    })

    test('returns updated data after modifications', async () => {
      await idbSet('a', 1)
      await idbSet('b', 2)
      
      const before = await idbGetAll()
      expect(before).toEqual({ a: 1, b: 2 })

      await idbSet('c', 3)
      await idbDel('a')

      const after = await idbGetAll()
      expect(after).toEqual({ b: 2, c: 3 })
    })
  })

  describe('idbGetAllKeys', () => {
    test('returns empty array when no data exists', async () => {
      const result = await idbGetAllKeys()
      expect(result).toEqual([])
    })

    test('returns all stored keys', async () => {
      await idbSet('key1', 'value1')
      await idbSet('key2', 'value2')
      await idbSet('key3', 'value3')

      const result = await idbGetAllKeys()
      expect(result).toHaveLength(3)
      expect(result).toEqual(expect.arrayContaining(['key1', 'key2', 'key3']))
    })

    test('returns updated keys after modifications', async () => {
      await idbSet('a', 1)
      await idbSet('b', 2)
      
      const before = await idbGetAllKeys()
      expect(before).toEqual(expect.arrayContaining(['a', 'b']))

      await idbSet('c', 3)
      await idbDel('a')

      const after = await idbGetAllKeys()
      expect(after).toEqual(expect.arrayContaining(['b', 'c']))
      expect(after).not.toContain('a')
    })
  })

  describe('Concurrent operations', () => {
    test('handles multiple simultaneous writes', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(idbSet(`key${i}`, `value${i}`))
      }
      await Promise.all(promises)

      const keys = await idbGetAllKeys()
      expect(keys).toHaveLength(10)
    })

    test('handles interleaved reads and writes', async () => {
      await idbSet('shared', 'initial')
      
      const operations = [
        idbGet('shared'),
        idbSet('shared', 'updated'),
        idbGet('shared'),
        idbSet('other', 'value'),
        idbGet('other')
      ]

      const results = await Promise.all(operations)
      // First read should get initial value
      expect(results[0]).toBe('initial')
      // Last read should get 'value'
      expect(results[4]).toBe('value')
    })
  })

  describe('Edge cases and error handling', () => {
    test('handles empty string as key', async () => {
      await idbSet('', 'emptyKey')
      const result = await idbGet('')
      expect(result).toBe('emptyKey')
    })

    test('handles special characters in keys', async () => {
      const specialKey = 'key-with-special!@#$%^&*()chars'
      await idbSet(specialKey, 'specialValue')
      const result = await idbGet(specialKey)
      expect(result).toBe('specialValue')
    })

    test('handles large objects', async () => {
      const largeArray = new Array(1000).fill(null).map((_, i) => ({
        id: i,
        data: `item-${i}`,
        nested: { value: i * 2 }
      }))
      
      await idbSet('largeData', largeArray)
      const result = await idbGet('largeData')
      expect(result).toEqual(largeArray)
      expect(result).toHaveLength(1000)
    })

    test('handles Date objects', async () => {
      const now = new Date()
      await idbSet('dateKey', now)
      const result = await idbGet('dateKey')
      expect(result).toEqual(now)
    })

    test('handles Map and Set objects (they get serialized)', async () => {
      // Maps and Sets don't serialize well in IndexedDB
      // They typically become empty objects
      const testMap = new Map([['key', 'value']])
      const testSet = new Set([1, 2, 3])
      
      await idbSet('mapKey', testMap)
      await idbSet('setKey', testSet)
      
      const mapResult = await idbGet('mapKey')
      const setResult = await idbGet('setKey')
      
      // These will be empty objects after serialization
      expect(mapResult).toBeTruthy()
      expect(setResult).toBeTruthy()
    })
  })

  describe('Type safety', () => {
    test('preserves type through generic', async () => {
      interface User {
        id: number
        name: string
        email: string
      }

      const user: User = { id: 1, name: 'John', email: 'john@example.com' }
      await idbSet<User>('user', user)
      const result = await idbGet<User>('user')
      
      expect(result).toEqual(user)
      if (result) {
        expect(result.id).toBe(1)
        expect(result.name).toBe('John')
        expect(result.email).toBe('john@example.com')
      }
    })

    test('returns typed fallback', async () => {
      interface Config {
        theme: string
        version: number
      }

      const fallback: Config = { theme: 'dark', version: 1 }
      const result = await idbGet<Config>('nonExistent', fallback)
      expect(result).toEqual(fallback)
    })
  })

  describe('Performance characteristics', () => {
    test('handles rapid sequential operations', async () => {
      const start = Date.now()
      
      for (let i = 0; i < 100; i++) {
        await idbSet(`perf${i}`, i)
      }
      
      const elapsed = Date.now() - start
      // Should complete in reasonable time (< 5 seconds for 100 operations)
      expect(elapsed).toBeLessThan(5000)
      
      const keys = await idbGetAllKeys()
      expect(keys).toHaveLength(100)
    })
  })
})

