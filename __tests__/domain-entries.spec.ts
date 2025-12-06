import { listDomainEntries, normalizeDomainEntry } from '@/lib/hooks/use-domain-entries'

describe('domain entries helpers', () => {
  it('normalizes domain entry shape', () => {
    const now = new Date().toISOString()
    const entry = {
      id: 'id1',
      domain: 'education',
      title: 'Course',
      description: null,
      created_at: now,
      updated_at: now,
      metadata: { itemType: 'Course' },
    }
    const normalized = normalizeDomainEntry(entry)
    expect(normalized.id).toBe('id1')
    expect(normalized.domain).toBe('education')
    expect(normalized.title).toBe('Course')
    expect(normalized.metadata).toEqual({ itemType: 'Course' })
  })
})








