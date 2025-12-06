// Normalize Google Fit data into DataProvider domain entries

export type DomainItem = {
  id: string
  domain: string
  title: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, any>
}

export function mapSteps(date: string, steps: number): DomainItem {
  const id = `steps_${date}_${steps}`
  const now = new Date().toISOString()
  return {
    id,
    domain: 'fitness',
    title: 'Steps',
    createdAt: now,
    updatedAt: now,
    metadata: {
      itemType: 'activity',
      activityType: 'Walking',
      date,
      steps,
    },
  }
}

export function mapWorkout(session: any): DomainItem {
  const id = `workout_${session.id || session.startTimeMillis}`
  const now = new Date().toISOString()
  return {
    id,
    domain: 'fitness',
    title: session.name || 'Workout',
    createdAt: now,
    updatedAt: now,
    metadata: {
      itemType: 'activity',
      activityType: session.activityType || 'Workout',
      start: session.startTimeMillis,
      end: session.endTimeMillis,
      durationMin: session.durationMin || null,
      calories: session.calories || null,
    },
  }
}

export function mapWeight(date: string, kg: number): DomainItem {
  const id = `weight_${date}`
  const now = new Date().toISOString()
  return {
    id,
    domain: 'health',
    title: 'Weight',
    createdAt: now,
    updatedAt: now,
    metadata: {
      recordType: 'Vitals',
      date,
      weight: kg,
    },
  }
}

export function mapSleep(session: any): DomainItem {
  const id = `sleep_${session.startTimeMillis}`
  const now = new Date().toISOString()
  return {
    id,
    domain: 'health',
    title: 'Sleep',
    createdAt: now,
    updatedAt: now,
    metadata: {
      recordType: 'Sleep',
      start: session.startTimeMillis,
      end: session.endTimeMillis,
      durationMin: session.durationMin || null,
      stages: session.stages || null,
    },
  }
}

export function mapHeartRate(timestampMs: number, bpm: number): DomainItem {
  const id = `hr_${timestampMs}_${bpm}`
  const now = new Date().toISOString()
  const date = new Date(timestampMs).toISOString().slice(0, 10)
  return {
    id,
    domain: 'health',
    title: 'Heart Rate',
    createdAt: now,
    updatedAt: now,
    metadata: {
      recordType: 'Vitals',
      date,
      timestamp: new Date(timestampMs).toISOString(),
      heartRate: bpm,
    },
  }
}

export function mapBloodPressure(timestampMs: number, systolic: number, diastolic: number): DomainItem {
  const id = `bp_${timestampMs}_${systolic}_${diastolic}`
  const now = new Date().toISOString()
  const date = new Date(timestampMs).toISOString().slice(0, 10)
  return {
    id,
    domain: 'health',
    title: 'Blood Pressure',
    createdAt: now,
    updatedAt: now,
    metadata: {
      recordType: 'Vitals',
      date,
      timestamp: new Date(timestampMs).toISOString(),
      systolic,
      diastolic,
    },
  }
}

export function mapCalories(date: string, calories: number): DomainItem {
  const id = `calories_${date}_${calories}`
  const now = new Date().toISOString()
  return {
    id,
    domain: 'fitness',
    title: 'Active Calories',
    createdAt: now,
    updatedAt: now,
    metadata: {
      itemType: 'activity',
      activityType: 'Calories',
      date,
      calories,
    },
  }
}


