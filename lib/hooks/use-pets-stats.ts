import { useState, useEffect } from 'react'

export interface VaccineAlert {
  id: string
  petId: string
  petName: string
  vaccineName: string
  nextDueDate: string
  daysUntilDue: number
}

export interface PetsStats {
  hasData: boolean
  petProfileCount: number
  vaccinesDue: number
  vetVisitsLast30Cost: number
  monthlyCost: number
  vaccineAlerts: VaccineAlert[]
}

/**
 * Custom hook to fetch accurate pet statistics from dedicated API endpoints
 * instead of relying on domain_entries
 */
export function usePetsStats() {
  const [stats, setStats] = useState<PetsStats>({
    hasData: false,
    petProfileCount: 0,
    vaccinesDue: 0,
    vetVisitsLast30Cost: 0,
    monthlyCost: 0,
    vaccineAlerts: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPetsStats()
    
    // Listen for pet data updates
    const handleUpdate = () => loadPetsStats()
    window.addEventListener('pets-data-updated', handleUpdate)
    window.addEventListener('data-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('pets-data-updated', handleUpdate)
      window.removeEventListener('data-updated', handleUpdate)
    }
  }, [])

  const loadPetsStats = async () => {
    try {
      // Fetch all pets
      const petsRes = await fetch('/api/pets')
      if (!petsRes.ok) {
        setStats({
          hasData: false,
          petProfileCount: 0,
          vaccinesDue: 0,
          vetVisitsLast30Cost: 0,
          monthlyCost: 0,
          vaccineAlerts: [],
        })
        setIsLoading(false)
        return
      }

      const { pets } = await petsRes.json()
      const petCount = (pets || []).length

      if (petCount === 0) {
        setStats({
          hasData: false,
          petProfileCount: 0,
          vaccinesDue: 0,
          vetVisitsLast30Cost: 0,
          monthlyCost: 0,
          vaccineAlerts: [],
        })
        setIsLoading(false)
        return
      }

      // Fetch vaccinations and costs for all pets in parallel
      const vaccinationsPromises = pets.map((pet: any) =>
        fetch(`/api/pets/vaccinations?petId=${pet.id}`).then(r => r.json()).catch(() => ({ vaccinations: [] }))
      )
      const costsPromises = pets.map((pet: any) =>
        fetch(`/api/pets/costs?petId=${pet.id}`).then(r => r.json()).catch(() => ({ costs: [] }))
      )

      const vaccinationsResults = await Promise.all(vaccinationsPromises)
      const costsResults = await Promise.all(costsPromises)

      // Calculate vaccines due within next 30 days and collect alerts
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      let vaccinesDue = 0
      const vaccineAlerts: VaccineAlert[] = []
      
      vaccinationsResults.forEach((result, index) => {
        const pet = pets[index]
        const vaccinations = result.vaccinations || []
        vaccinations.forEach((vacc: any) => {
          if (vacc.next_due_date) {
            const dueDate = new Date(vacc.next_due_date)
            const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (dueDate <= thirtyDaysFromNow && dueDate >= now) {
              vaccinesDue++
              vaccineAlerts.push({
                id: vacc.id,
                petId: pet.id,
                petName: pet.name,
                vaccineName: vacc.vaccine_name,
                nextDueDate: vacc.next_due_date,
                daysUntilDue
              })
            }
          }
        })
      })

      // Calculate vet visits cost in last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      let vetVisitsLast30Cost = 0
      costsResults.forEach(result => {
        const costs = result.costs || []
        costs.forEach((cost: any) => {
          if (cost.cost_type === 'vet') {
            const costDate = new Date(cost.date)
            if (costDate >= thirtyDaysAgo) {
              vetVisitsLast30Cost += Number(cost.amount) || 0
            }
          }
        })
      })

      // Calculate monthly recurring costs (excluding vet visits)
      let monthlyCost = 0
      costsResults.forEach(result => {
        const costs = result.costs || []
        costs.forEach((cost: any) => {
          if (cost.cost_type !== 'vet' && cost.metadata?.recurring === true) {
            monthlyCost += Number(cost.amount) || 0
          }
        })
      })

      setStats({
        hasData: true,
        petProfileCount: petCount,
        vaccinesDue,
        vetVisitsLast30Cost,
        monthlyCost,
        vaccineAlerts,
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading pets stats:', error)
      setStats({
        hasData: false,
        petProfileCount: 0,
        vaccinesDue: 0,
        vetVisitsLast30Cost: 0,
        monthlyCost: 0,
        vaccineAlerts: [],
      })
      setIsLoading(false)
    }
  }

  return { stats, isLoading, reload: loadPetsStats }
}

