import { computeHealthStats, computePetsStats } from '@/lib/dashboard/metrics-normalizers'
import type { DomainData } from '@/types/domains'
import { getDomainKPIs } from '@/app/domains/page'

const makeDomainEntry = <D extends DomainData['domain']>(
  domain: D,
  metadata: Record<string, unknown>,
  overrides: Partial<DomainData> = {}
): DomainData => ({
  id: overrides.id ?? `${domain}-${Math.random().toString(36).slice(2)}`,
  domain,
  title: overrides.title ?? 'Test Entry',
  description: overrides.description ?? undefined,
  createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2025-01-02T00:00:00Z').toISOString(),
  metadata: metadata as any,
})

describe('metrics normalizers', () => {
  describe('computeHealthStats', () => {
    it('normalizes vitals, medications, and blood pressure from mixed metadata', () => {
      const entries: DomainData[] = [
        makeDomainEntry('health', {
          recordType: 'Vitals',
          date: '2025-10-01T09:00:00Z',
          weight: 172.5,
          heartRate: 68,
          glucose: 95,
          systolic: 120,
          diastolic: 80,
        }),
        makeDomainEntry('health', {
          recordType: 'Vitals',
          date: '2025-10-10T09:00:00Z',
          weight: 171.2,
          heartRate: 70,
          glucose: 92,
          steps: 8421,
          bloodPressure: {
            systolic: 118,
            diastolic: 78,
          },
        }),
        makeDomainEntry('health', {
          recordType: 'Medication',
          medicationName: 'Vitamin D3',
        }),
      ]

      const stats = computeHealthStats(entries)

      expect(stats.hasData).toBe(true)
      expect(stats.vitalsCount).toBe(2)
      expect(stats.medicationCount).toBe(1)
      expect(stats.heartRate).toBe(70)
      expect(stats.weight).toBeCloseTo(171.2)
      expect(stats.glucose).toBe(92)
      expect(stats.bloodPressure).toBe('118/78')
    })
  })

  describe('computePetsStats', () => {
    const now = new Date()
    const isoDaysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
    const isoDaysAhead = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

    it('aggregates pet expenses, vet visits, and vaccines due', () => {
      const entries: DomainData[] = [
        makeDomainEntry('pets', {
          type: 'pet',
          petName: 'Max',
          species: 'Dog',
        }),
        makeDomainEntry('pets', {
          type: 'appointment',
          date: isoDaysAgo(7),
          cost: 120,
          veterinarian: 'Dr. Smith',
        }),
        makeDomainEntry('pets', {
          type: 'expense',
          amount: 80,
          date: isoDaysAgo(3),
        }),
        makeDomainEntry('pets', {
          type: 'vaccination',
          nextDue: isoDaysAhead(10),
          vaccine: 'Rabies',
        }),
      ]

      const stats = computePetsStats(entries)

      expect(stats.hasData).toBe(true)
      expect(stats.petProfileCount).toBe(1)
      expect(stats.vetVisitCountYear).toBe(1)
      expect(stats.vetVisitsLast30Cost).toBe(120)
      expect(stats.monthlyCost).toBe(80)
      expect(stats.vaccinesDue).toBe(1)
    })
  })

  describe('getDomainKPIs integration', () => {
    it('returns health KPIs derived from normalized metadata', () => {
      const entries: DomainData[] = [
        makeDomainEntry('health', {
          recordType: 'Vitals',
          date: '2025-10-10T09:00:00Z',
          heartRate: 70,
          weight: 171.2,
          glucose: 92,
        }),
        makeDomainEntry('health', {
          recordType: 'Vitals',
          date: '2025-10-01T09:00:00Z',
          heartRate: 68,
          weight: 172.5,
        }),
      ]

      const kpis = getDomainKPIs('health', { health: entries } as Record<string, DomainData[]>)

      expect(kpis.kpi1.value).toBe('70 bpm')
      expect(kpis.kpi2.value).toBe('171.2 lbs')
      expect(kpis.kpi3.value).toBe('2')
      expect(kpis.kpi4.value).toBe('2')
    })

    it('returns pets KPIs derived from normalized metadata', () => {
      const now = new Date()
      const entries: DomainData[] = [
        makeDomainEntry('pets', {
          type: 'pet',
          petName: 'Max',
        }),
        makeDomainEntry('pets', {
          type: 'expense',
          amount: 50,
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        makeDomainEntry('pets', {
          type: 'appointment',
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          cost: 95,
        }),
        makeDomainEntry('pets', {
          type: 'vaccination',
          nextDue: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ]

      const kpis = getDomainKPIs('pets', { pets: entries } as Record<string, DomainData[]>)

      expect(kpis.kpi1.value).toBe('1')
      expect(kpis.kpi2.value).toBe('1')
      expect(kpis.kpi3.value).toBe('1')
      expect(kpis.kpi4.value).toBe('$50')
    })
  })
})



