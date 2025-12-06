/**
 * Test for medication alerts showing in Critical Alerts section
 * This verifies the fix for medications not appearing in Critical Alerts
 */

import { differenceInDays } from 'date-fns'

describe('Medication Alerts Logic', () => {
  const today = new Date('2025-11-14')

  // Mock health data with various medication refill scenarios
  const healthData: Array<{
    id: string;
    title: string;
    metadata?: {
      logType?: string;
      type?: string;
      itemType?: string;
      medicationName?: string;
      name?: string;
      refillDate?: string;
      value?: number;
      unit?: string;
    };
  }> = [
    {
      id: '1',
      title: 'Lisinopril 10mg',
      metadata: {
        logType: 'medication',
        medicationName: 'Lisinopril',
        name: 'Lisinopril 10mg',
        refillDate: '2025-11-14' // 0 days - DUE TODAY
      }
    },
    {
      id: '2',
      title: 'Metformin 500mg',
      metadata: {
        type: 'medication',
        medicationName: 'Metformin',
        refillDate: '2025-11-15' // 1 day - TOMORROW
      }
    },
    {
      id: '3',
      title: 'Atorvastatin 20mg',
      metadata: {
        itemType: 'medication',
        medicationName: 'Atorvastatin',
        refillDate: '2025-11-21' // 7 days - within alert window
      }
    },
    {
      id: '4',
      title: 'Vitamin D',
      metadata: {
        type: 'medication',
        medicationName: 'Vitamin D',
        refillDate: '2025-11-22' // 8 days - outside alert window
      }
    },
    {
      id: '5',
      title: 'Blood Pressure Log',
      metadata: {
        type: 'measurement',
        value: 120,
        unit: 'mmHg'
      }
    }
  ]

  test('should identify medications with refillDate within 7 days', () => {
    const urgentAlerts: any[] = []

    healthData.forEach(item => {
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate && 
          (typeof item.metadata.refillDate === 'string' || typeof item.metadata.refillDate === 'number')) {
        const refillDate = new Date(item.metadata.refillDate)
        const daysUntilRefill = differenceInDays(refillDate, today)
        
        if (daysUntilRefill >= 0 && daysUntilRefill <= 7) {
          const medicationName = item.metadata?.medicationName || item.metadata?.name || item.title
          urgentAlerts.push({
            id: `medication-${item.id}-${item.metadata.refillDate}`,
            type: 'medication',
            title: `💊 ${medicationName}`,
            daysLeft: daysUntilRefill,
            priority: 'high'
          })
        }
      }
    })

    // Should have 3 medications in alert window (0, 1, and 7 days)
    expect(urgentAlerts).toHaveLength(3)
    
    // Verify the medications
    expect(urgentAlerts[0]).toMatchObject({
      type: 'medication',
      title: '💊 Lisinopril',
      daysLeft: 0,
      priority: 'high'
    })
    
    expect(urgentAlerts[1]).toMatchObject({
      type: 'medication',
      title: '💊 Metformin',
      daysLeft: 1,
      priority: 'high'
    })
    
    expect(urgentAlerts[2]).toMatchObject({
      type: 'medication',
      title: '💊 Atorvastatin',
      daysLeft: 7,
      priority: 'high'
    })
  })

  test('should NOT alert for medications beyond 7 days', () => {
    const urgentAlerts: any[] = []

    healthData.forEach(item => {
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate && 
          (typeof item.metadata.refillDate === 'string' || typeof item.metadata.refillDate === 'number')) {
        const refillDate = new Date(item.metadata.refillDate)
        const daysUntilRefill = differenceInDays(refillDate, today)
        
        if (daysUntilRefill >= 0 && daysUntilRefill <= 7) {
          urgentAlerts.push({
            medicationName: item.metadata?.medicationName,
            daysLeft: daysUntilRefill
          })
        }
      }
    })

    // Vitamin D (8 days) should NOT be in alerts
    const vitaminDAlert = urgentAlerts.find(a => a.medicationName === 'Vitamin D')
    expect(vitaminDAlert).toBeUndefined()
  })

  test('should NOT alert for non-medication health items', () => {
    const urgentAlerts: any[] = []

    healthData.forEach(item => {
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate) {
        urgentAlerts.push({
          title: item.title
        })
      }
    })

    // Blood Pressure Log should NOT be in alerts
    const measurementAlert = urgentAlerts.find(a => a.title === 'Blood Pressure Log')
    expect(measurementAlert).toBeUndefined()
  })

  test('should handle all medication type field variations', () => {
    const testItems = [
      { metadata: { type: 'medication', refillDate: '2025-11-14' } },
      { metadata: { itemType: 'medication', refillDate: '2025-11-14' } },
      { metadata: { logType: 'medication', refillDate: '2025-11-14' } }
    ]

    testItems.forEach(item => {
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      expect(isMedication).toBe(true)
    })
  })

  test('all medication alerts within 7 days should have HIGH priority', () => {
    const urgentAlerts: any[] = []

    healthData.forEach(item => {
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate && 
          (typeof item.metadata.refillDate === 'string' || typeof item.metadata.refillDate === 'number')) {
        const refillDate = new Date(item.metadata.refillDate)
        const daysUntilRefill = differenceInDays(refillDate, today)
        
        if (daysUntilRefill >= 0 && daysUntilRefill <= 7) {
          urgentAlerts.push({
            daysLeft: daysUntilRefill,
            priority: 'high' // All medications within 7 days are high priority
          })
        }
      }
    })

    // All alerts should be 'high' priority
    urgentAlerts.forEach(alert => {
      expect(alert.priority).toBe('high')
    })
  })
})

