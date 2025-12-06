/**
 * COMPREHENSIVE Test Data Generator for LifeHub
 * Generates realistic sample data for ALL 21+ domains to populate dashboards
 * Ensures Command Center shows real metrics (no more zeros!)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Get user ID from command line or environment
const TEST_USER_ID: string = (() => {
  const userId = process.argv[2] || process.env.TEST_USER_ID
  if (!userId) {
    console.error('❌ No user ID provided')
    console.error('Usage: tsx scripts/comprehensive-seed-data.ts <USER_ID>')
    console.error('Or set TEST_USER_ID environment variable')
    process.exit(1)
  }
  return userId
})()

interface TestDataStats {
  domain: string
  created: number
  errors: number
}

const stats: TestDataStats[] = []

// Helper to create domain entry
async function createDomainEntry(domain: string, entry: any) {
  return supabase.from('domain_entries').insert({
    user_id: TEST_USER_ID,
    domain,
    ...entry
  })
}

/**
 * 1. FINANCIAL DOMAIN - Comprehensive financial data
 */
async function generateFinancialData() {
  console.log('\n💰 Generating Financial Data...')
  const domain = 'financial'
  let created = 0
  let errors = 0

  const entries = [
    // Income entries
    {
      title: 'Monthly Salary - Tech Corp',
      description: 'Regular paycheck',
      metadata: {
        type: 'income',
        amount: 8500,
        category: 'salary',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Freelance Project - Web Design',
      description: 'Client website project',
      metadata: {
        type: 'income',
        amount: 2500,
        category: 'freelance',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Investment Dividend - VTSAX',
      description: 'Quarterly dividend',
      metadata: {
        type: 'income',
        amount: 450,
        category: 'investment',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    // Expenses
    {
      title: 'Whole Foods - Groceries',
      description: 'Weekly grocery shopping',
      metadata: {
        type: 'expense',
        amount: 156.78,
        category: 'groceries',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Shell Gas Station',
      description: 'Vehicle fuel',
      metadata: {
        type: 'expense',
        amount: 52.30,
        category: 'transportation',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Italian Bistro - Dinner',
      description: 'Dinner with friends',
      metadata: {
        type: 'expense',
        amount: 89.45,
        category: 'dining',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'PG&E Electric Bill',
      description: 'Monthly electricity',
      metadata: {
        type: 'expense',
        amount: 145.67,
        category: 'utilities',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        recurring: true
      }
    },
    {
      title: 'Netflix Subscription',
      description: 'Streaming service',
      metadata: {
        type: 'expense',
        amount: 15.99,
        category: 'entertainment',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        recurring: true
      }
    },
    {
      title: 'Amazon Prime',
      description: 'Annual membership',
      metadata: {
        type: 'expense',
        amount: 139,
        category: 'subscription',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        recurring: true
      }
    },
    {
      title: 'Gym Membership - 24 Hour Fitness',
      description: 'Monthly gym fee',
      metadata: {
        type: 'expense',
        amount: 45,
        category: 'health',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        recurring: true
      }
    },
    // Accounts
    {
      title: 'Chase Checking Account',
      description: 'Primary checking',
      metadata: {
        itemType: 'account',
        accountType: 'checking',
        balance: 5420.50,
        institution: 'Chase',
        accountNumber: '****1234'
      }
    },
    {
      title: 'Chase Savings Account',
      description: 'Emergency fund',
      metadata: {
        itemType: 'account',
        accountType: 'savings',
        balance: 18500,
        institution: 'Chase',
        accountNumber: '****5678',
        interestRate: 0.5
      }
    },
    {
      title: 'Vanguard 401k',
      description: 'Retirement account',
      metadata: {
        itemType: 'account',
        accountType: 'investment',
        balance: 125000,
        institution: 'Vanguard',
        accountNumber: '****9012'
      }
    },
    {
      title: 'Chase Sapphire Credit Card',
      description: 'Primary credit card',
      metadata: {
        itemType: 'account',
        accountType: 'credit',
        balance: -2340.67,
        creditLimit: 10000,
        institution: 'Chase',
        accountNumber: '****3456'
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} financial entries`)
}

/**
 * 2. HEALTH DOMAIN - Comprehensive health tracking
 */
async function generateHealthData() {
  console.log('\n🏥 Generating Health Data...')
  const domain = 'health'
  let created = 0
  let errors = 0

  const entries = [
    // Vitals
    {
      title: 'Morning Weight Check',
      description: 'Daily weigh-in',
      metadata: {
        recordType: 'vitals',
        weight: 175.2,
        unit: 'lbs',
        date: new Date().toISOString()
      }
    },
    {
      title: 'Blood Pressure Reading',
      description: 'Morning BP check',
      metadata: {
        recordType: 'vitals',
        systolic: 118,
        diastolic: 78,
        heartRate: 72,
        date: new Date().toISOString()
      }
    },
    {
      title: 'Daily Steps',
      description: 'Fitness tracker data',
      metadata: {
        recordType: 'fitness',
        steps: 8542,
        distance: 4.2,
        unit: 'miles',
        caloriesBurned: 420,
        date: new Date().toISOString()
      }
    },
    // Medications
    {
      title: 'Vitamin D3 - 2000 IU',
      description: 'Daily supplement',
      metadata: {
        recordType: 'medication',
        dosage: '2000 IU',
        frequency: 'daily',
        prescriber: 'Dr. Smith',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Omega-3 Fish Oil',
      description: 'Heart health supplement',
      metadata: {
        recordType: 'medication',
        dosage: '1000 mg',
        frequency: 'daily',
        prescriber: 'Self',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    // Appointments
    {
      title: 'Annual Physical Exam',
      description: 'Yearly checkup',
      metadata: {
        recordType: 'appointment',
        provider: 'Dr. Sarah Johnson',
        specialty: 'Primary Care',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'City Medical Center',
        status: 'scheduled'
      }
    },
    {
      title: 'Dental Cleaning',
      description: '6-month checkup',
      metadata: {
        recordType: 'appointment',
        provider: 'Dr. Michael Chen',
        specialty: 'Dentistry',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Bright Smile Dental',
        status: 'scheduled'
      }
    },
    // Workouts
    {
      title: 'Morning Run - 5K',
      description: 'Outdoor cardio',
      metadata: {
        recordType: 'workout',
        activity: 'running',
        duration: 35,
        distance: 5,
        calories: 420,
        date: new Date().toISOString()
      }
    },
    {
      title: 'Strength Training - Upper Body',
      description: 'Gym workout',
      metadata: {
        recordType: 'workout',
        activity: 'strength training',
        duration: 45,
        calories: 280,
        exercises: 'Bench press, rows, shoulder press',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    // Lab results
    {
      title: 'Blood Test - Annual Physical',
      description: 'Comprehensive metabolic panel',
      metadata: {
        recordType: 'lab',
        testType: 'Blood Work',
        cholesterol: 180,
        hdl: 65,
        ldl: 95,
        glucose: 92,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'normal'
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} health entries`)
}

/**
 * 3. INSURANCE DOMAIN - Multiple policy types
 */
async function generateInsuranceData() {
  console.log('\n🛡️  Generating Insurance Data...')
  const domain = 'insurance'
  let created = 0
  let errors = 0

  const entries = [
    {
      title: 'Health Insurance - Blue Cross',
      description: 'PPO plan with family coverage',
      metadata: {
        type: 'health',
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'HC-123456789',
        monthlyPremium: 450,
        deductible: 1500,
        coverage: 'Family',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Auto Insurance - State Farm',
      description: 'Full coverage for 2020 Camry',
      metadata: {
        type: 'auto',
        provider: 'State Farm',
        policyNumber: 'AUTO-789012',
        monthlyPremium: 145,
        deductible: 500,
        coverage: 'Comprehensive + Collision',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        vehicles: ['2020 Toyota Camry']
      }
    },
    {
      title: 'Home Insurance - Allstate',
      description: 'Homeowner\'s policy',
      metadata: {
        type: 'home',
        provider: 'Allstate',
        policyNumber: 'HOME-345678',
        monthlyPremium: 120,
        deductible: 1000,
        coverage: 'Dwelling + Personal Property',
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
        coverageAmount: 450000
      }
    },
    {
      title: 'Life Insurance - Northwestern Mutual',
      description: 'Term life - 20 year',
      metadata: {
        type: 'life',
        provider: 'Northwestern Mutual',
        policyNumber: 'LIFE-901234',
        monthlyPremium: 75,
        coverage: '500K Term',
        expiryDate: new Date(Date.now() + 7300 * 24 * 60 * 60 * 1000).toISOString(),
        beneficiaries: ['Spouse', 'Children']
      }
    },
    {
      title: 'Dental Insurance - Delta Dental',
      description: 'Family dental coverage',
      metadata: {
        type: 'dental',
        provider: 'Delta Dental',
        policyNumber: 'DENTAL-567890',
        monthlyPremium: 55,
        coverage: 'Family',
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} insurance entries`)
}

/**
 * 4. VEHICLES DOMAIN - Vehicle and maintenance tracking
 */
async function generateVehicleData() {
  console.log('\n🚗 Generating Vehicle Data...')
  const domain = 'vehicles'
  let created = 0
  let errors = 0

  const entries = [
    {
      title: '2020 Toyota Camry',
      description: 'Primary family vehicle',
      metadata: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '4T1BF1FK5CU123456',
        mileage: 35420,
        licensePlate: 'ABC1234',
        color: 'Silver',
        purchaseDate: '2020-03-15',
        purchasePrice: 28500,
        estimatedValue: 22000,
        fuelType: 'Gasoline'
      }
    },
    {
      title: 'Oil Change - Toyota Service Center',
      description: 'Regular maintenance - 5W-30 synthetic',
      metadata: {
        type: 'maintenance',
        vehicle: '2020 Toyota Camry',
        service: 'Oil Change',
        cost: 45.99,
        mileage: 35000,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextDue: 38000,
        nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Tire Rotation & Balance',
      description: 'Quarterly tire service',
      metadata: {
        type: 'maintenance',
        vehicle: '2020 Toyota Camry',
        service: 'Tire Rotation',
        cost: 35,
        mileage: 35420,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Annual Vehicle Registration',
      description: 'DMV registration renewal',
      metadata: {
        type: 'registration',
        vehicle: '2020 Toyota Camry',
        cost: 180,
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} vehicle entries`)
}

/**
 * 5. PETS DOMAIN - Pet profiles and care
 */
async function generatePetData() {
  console.log('\n🐾 Generating Pet Data...')
  const domain = 'pets'
  let created = 0
  let errors = 0

  const entries = [
    {
      title: 'Max - Golden Retriever',
      description: 'Family dog, 3 years old',
      metadata: {
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 68,
        birthDate: '2021-05-15',
        microchipNumber: '123456789012345',
        color: 'Golden'
      }
    },
    {
      title: 'Rabies Vaccination - Max',
      description: 'Annual rabies shot',
      metadata: {
        type: 'vaccination',
        pet: 'Max',
        vaccine: 'Rabies',
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        nextDue: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        veterinarian: 'Dr. Emily Brown',
        clinic: 'Happy Paws Veterinary'
      }
    },
    {
      title: 'DHPP Vaccination - Max',
      description: 'Distemper combo vaccine',
      metadata: {
        type: 'vaccination',
        pet: 'Max',
        vaccine: 'DHPP',
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        nextDue: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        veterinarian: 'Dr. Emily Brown'
      }
    },
    {
      title: 'Monthly Pet Food - Premium Kibble',
      description: 'Blue Buffalo large breed',
      metadata: {
        type: 'expense',
        pet: 'Max',
        category: 'food',
        amount: 68.99,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        recurring: true
      }
    },
    {
      title: 'Annual Checkup - Max',
      description: 'Wellness exam',
      metadata: {
        type: 'appointment',
        pet: 'Max',
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        veterinarian: 'Dr. Emily Brown',
        cost: 125,
        notes: 'Healthy, slight weight gain'
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} pet entries`)
}

/**
 * 6. HOME DOMAIN - Property and maintenance
 */
async function generateHomeData() {
  console.log('\n🏠 Generating Home Data...')
  const domain = 'home'
  let created = 0
  let errors = 0

  const entries = [
    {
      title: '123 Main Street',
      description: 'Primary residence',
      metadata: {
        type: 'property',
        address: '123 Main St, San Francisco, CA 94102',
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1850,
        purchaseDate: '2020-06-15',
        purchasePrice: 850000,
        estimatedValue: 920000,
        yearBuilt: 1985
      }
    },
    {
      title: 'HVAC Filter Replacement',
      description: 'Change AC filter',
      metadata: {
        type: 'maintenance',
        category: 'HVAC',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cost: 25,
        frequency: 'quarterly'
      }
    },
    {
      title: 'Roof Inspection',
      description: 'Annual roof check',
      metadata: {
        type: 'maintenance',
        category: 'Exterior',
        status: 'completed',
        completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        cost: 150,
        contractor: 'ABC Roofing',
        notes: 'No issues found, good condition'
      }
    },
    {
      title: 'Water Heater Service',
      description: 'Annual flush and inspection',
      metadata: {
        type: 'maintenance',
        category: 'Plumbing',
        status: 'completed',
        completedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        cost: 95,
        contractor: 'City Plumbing'
      }
    },
    {
      title: 'Mortgage Payment',
      description: 'Monthly mortgage',
      metadata: {
        type: 'expense',
        category: 'housing',
        amount: 3500,
        recurring: true,
        lender: 'Wells Fargo',
        accountNumber: '****6789'
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} home entries`)
}

/**
 * 7. EDUCATION DOMAIN - Courses and certifications
 */
async function generateEducationData() {
  console.log('\n🎓 Generating Education Data...')
  const domain = 'education'
  let created = 0
  let errors = 0

  const entries = [
    {
      title: 'AWS Solutions Architect Certification',
      description: 'Cloud certification program',
      metadata: {
        type: 'certification',
        provider: 'Amazon Web Services',
        status: 'in-progress',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        cost: 150,
        progress: 45
      }
    },
    {
      title: 'Machine Learning Specialization - Coursera',
      description: 'Stanford University course',
      metadata: {
        type: 'course',
        provider: 'Coursera',
        instructor: 'Andrew Ng',
        status: 'completed',
        completedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        grade: 'A',
        certificateUrl: 'https://coursera.org/cert/...'
      }
    },
    {
      title: 'Spanish Language Course - Duolingo',
      description: 'Learning Spanish',
      metadata: {
        type: 'course',
        provider: 'Duolingo',
        status: 'in-progress',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 35,
        streak: 42
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} education entries`)
}

/**
 * 8. CAREER DOMAIN - Job applications and skills
 */
async function generateCareerData() {
  console.log('\n💼 Generating Career Data...')
  const domain = 'career'
  let created = 0
  let errors = 0

  const entries = [
    {
      title: 'Software Engineer - Tech Corp',
      description: 'Current position',
      metadata: {
        type: 'employment',
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        status: 'current',
        startDate: '2021-03-01',
        salary: 145000,
        location: 'San Francisco, CA'
      }
    },
    {
      title: 'React Expert',
      description: 'Frontend framework',
      metadata: {
        type: 'skill',
        skillName: 'React',
        proficiency: 'expert',
        yearsExperience: 5,
        lastUsed: new Date().toISOString()
      }
    },
    {
      title: 'TypeScript Advanced',
      description: 'Programming language',
      metadata: {
        type: 'skill',
        skillName: 'TypeScript',
        proficiency: 'advanced',
        yearsExperience: 4,
        lastUsed: new Date().toISOString()
      }
    },
    {
      title: 'Annual Performance Review',
      description: '2024 review',
      metadata: {
        type: 'review',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        rating: 'exceeds expectations',
        raisePercentage: 5,
        notes: 'Strong technical leadership'
      }
    }
  ]

  for (const entry of entries) {
    try {
      const { error } = await createDomainEntry(domain, entry)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} career entries`)
}

/**
 * 9. TRAVEL - Travel plans and bookings (using specialized tables)
 */
async function generateTravelData() {
  console.log('\n✈️  Generating Travel Data...')
  let created = 0
  let errors = 0

  // Create a trip
  try {
    const { data: trip, error: tripError } = await supabase
      .from('travel_trips')
      .insert({
        user_id: TEST_USER_ID,
        title: 'Summer Vacation - Hawaii',
        destination: 'Maui, Hawaii',
        start_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metadata: {
          status: 'planned',
          travelers: 2,
          budget: 5000
        }
      })
      .select()
      .single()

    if (tripError) throw tripError
    created++

    // Create bookings for this trip
    const bookings = [
      {
        user_id: TEST_USER_ID,
        trip_id: trip.id,
        booking_type: 'Flight',
        name: 'United Airlines - SFO to OGG',
        destination: 'Maui',
        start_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: '$850',
        status: 'confirmed',
        confirmation_number: 'UA123456'
      },
      {
        user_id: TEST_USER_ID,
        trip_id: trip.id,
        booking_type: 'Hotel',
        name: 'Grand Wailea Resort',
        destination: 'Maui',
        start_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: '$2100',
        status: 'confirmed',
        confirmation_number: 'GW789012'
      }
    ]

    for (const booking of bookings) {
      const { error } = await supabase.from('travel_bookings').insert(booking)
      if (error) throw error
      created++
    }
  } catch (e: any) {
    console.error(`  ❌ Travel data: ${e.message}`)
    errors++
  }

  stats.push({ domain: 'travel', created, errors })
  console.log(`  ✅ Created ${created} travel entries`)
}

/**
 * 10. TASKS - Todo items
 */
async function generateTasks() {
  console.log('\n✅ Generating Tasks...')
  let created = 0
  let errors = 0

  const tasks = [
    {
      title: 'Review Q1 financial reports',
      description: 'Analyze spending and budget variance',
      completed: false,
      priority: 'high',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'finance'
    },
    {
      title: 'Schedule annual checkup',
      description: 'Book with Dr. Johnson',
      completed: false,
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'health'
    },
    {
      title: 'Renew vehicle registration',
      description: 'DMV registration',
      completed: false,
      priority: 'high',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'vehicles'
    },
    {
      title: 'Buy groceries',
      description: 'Weekly shopping',
      completed: true,
      priority: 'medium',
      due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'personal'
    },
    {
      title: 'Plan Hawaii trip activities',
      description: 'Research and book excursions',
      completed: false,
      priority: 'medium',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'travel'
    }
  ]

  for (const task of tasks) {
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: TEST_USER_ID,
        ...task
      })
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${task.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain: 'tasks', created, errors })
  console.log(`  ✅ Created ${created} tasks`)
}

/**
 * 11. HABITS - Habit tracking
 */
async function generateHabits() {
  console.log('\n🎯 Generating Habits...')
  let created = 0
  let errors = 0

  const habits = [
    {
      name: 'Morning Meditation',
      description: '10 minutes mindfulness',
      icon: '🧘',
      frequency: 'daily',
      streak: 12,
      last_completed_at: new Date().toISOString()
    },
    {
      name: 'Drink 8 glasses of water',
      description: 'Stay hydrated',
      icon: '💧',
      frequency: 'daily',
      streak: 7,
      last_completed_at: new Date().toISOString()
    },
    {
      name: 'Exercise 30 minutes',
      description: 'Physical activity',
      icon: '💪',
      frequency: 'daily',
      streak: 5,
      last_completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      name: 'Read for 30 minutes',
      description: 'Daily reading habit',
      icon: '📚',
      frequency: 'daily',
      streak: 18,
      last_completed_at: new Date().toISOString()
    },
    {
      name: 'Journal',
      description: 'Reflect on the day',
      icon: '📝',
      frequency: 'daily',
      streak: 9,
      last_completed_at: new Date().toISOString()
    }
  ]

  for (const habit of habits) {
    try {
      const { error } = await supabase.from('habits').insert({
        user_id: TEST_USER_ID,
        ...habit
      })
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${habit.name}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain: 'habits', created, errors })
  console.log(`  ✅ Created ${created} habits`)
}

/**
 * 12. NOTIFICATIONS - Important alerts
 */
async function generateNotifications() {
  console.log('\n🔔 Generating Notifications...')
  let created = 0
  let errors = 0

  const notifications = [
    {
      user_id: TEST_USER_ID,
      type: 'bill_due',
      priority: 'important',
      title: 'Electric Bill Due Soon',
      message: 'PG&E bill of $145.67 is due in 3 days',
      icon: '⚡',
      action_url: '/domains/utilities',
      action_label: 'View Bill',
      related_domain: 'utilities',
      read: false,
      dismissed: false
    },
    {
      user_id: TEST_USER_ID,
      type: 'insurance_expiring',
      priority: 'critical',
      title: 'Auto Insurance Renewal',
      message: 'Auto insurance policy expires in 30 days',
      icon: '🚗',
      action_url: '/domains/insurance',
      action_label: 'Review Policy',
      related_domain: 'insurance',
      read: false,
      dismissed: false
    },
    {
      user_id: TEST_USER_ID,
      type: 'health_reminder',
      priority: 'important',
      title: 'Upcoming Appointment',
      message: 'Annual physical with Dr. Johnson in 30 days',
      icon: '🏥',
      action_url: '/domains/health',
      action_label: 'View Details',
      related_domain: 'health',
      read: false,
      dismissed: false
    },
    {
      user_id: TEST_USER_ID,
      type: 'goal_progress',
      priority: 'info',
      title: 'Habit Streak Milestone!',
      message: 'You\'ve maintained your meditation habit for 12 days!',
      icon: '🎯',
      action_url: '/habits',
      action_label: 'View Habits',
      read: false,
      dismissed: false
    }
  ]

  for (const notification of notifications) {
    try {
      const { error } = await supabase.from('notifications').insert(notification)
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ ${notification.title}: ${e.message}`)
      errors++
    }
  }

  stats.push({ domain: 'notifications', created, errors })
  console.log(`  ✅ Created ${created} notifications`)
}

/**
 * 13. Additional domains for comprehensive coverage
 */
async function generateAdditionalDomains() {
  console.log('\n📦 Generating Additional Domain Data...')

  const additionalData = [
    // Fitness
    { domain: 'fitness', title: 'Yoga Class', description: 'Morning flow yoga', metadata: { type: 'activity', duration: 60, calories: 240, date: new Date().toISOString() } },

    // Nutrition
    { domain: 'nutrition', title: 'Protein Shake', description: 'Post-workout shake', metadata: { calories: 250, protein: 30, carbs: 15, fat: 5, mealType: 'snack' } },

    // Mindfulness
    { domain: 'mindfulness', title: 'Evening Reflection', description: 'Gratitude journaling', metadata: { type: 'journal', mood: 8, duration: 15, date: new Date().toISOString() } },

    // Legal
    { domain: 'legal', title: 'Passport', description: 'US Passport', metadata: { documentType: 'passport', number: 'P123456789', expiryDate: new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000).toISOString() } },

    // Digital
    { domain: 'digital', title: 'Spotify Premium', description: 'Music streaming', metadata: { type: 'subscription', cost: 9.99, renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() } },

    // Appliances
    { domain: 'appliances', title: 'Samsung Refrigerator', description: 'French door fridge', metadata: { brand: 'Samsung', model: 'RF28R7351SR', purchaseDate: '2021-08-10', warrantyExpiry: '2026-08-10' } },

    // Collectibles
    { domain: 'collectibles', title: 'Vintage Watch Collection', description: 'Rolex Submariner', metadata: { category: 'Watches', estimatedValue: 15000, purchasePrice: 8000, purchaseDate: '2018-05-20' } },

    // Utilities
    { domain: 'utilities', title: 'Internet - Comcast', description: 'High-speed fiber', metadata: { provider: 'Comcast', amount: 79.99, dueDate: '1st of month', status: 'paid' } }
  ]

  let totalCreated = 0
  let totalErrors = 0

  for (const entry of additionalData) {
    try {
      const { error } = await createDomainEntry(entry.domain, {
        title: entry.title,
        description: entry.description,
        metadata: entry.metadata
      })
      if (error) throw error
      totalCreated++
    } catch (e: any) {
      console.error(`  ❌ ${entry.title}: ${e.message}`)
      totalErrors++
    }
  }

  stats.push({ domain: 'additional_domains', created: totalCreated, errors: totalErrors })
  console.log(`  ✅ Created ${totalCreated} additional domain entries`)
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('🚀 COMPREHENSIVE LIFEHUB TEST DATA GENERATOR')
  console.log('=' .repeat(60))
  console.log(`📝 Target User ID: ${TEST_USER_ID}`)
  console.log('=' .repeat(60))

  try {
    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (userError) {
      console.warn(`⚠️  Warning: Could not verify user ${TEST_USER_ID}`)
      console.warn('   Data will still be created. Ensure this user ID is valid.')
    } else {
      console.log(`✅ User verified: ${user?.user?.email || 'No email'}`)
    }

    console.log('\n🏗️  Generating data for all domains...\n')

    // Generate all data
    await generateFinancialData()
    await generateHealthData()
    await generateInsuranceData()
    await generateVehicleData()
    await generatePetData()
    await generateHomeData()
    await generateEducationData()
    await generateCareerData()
    await generateTravelData()
    await generateTasks()
    await generateHabits()
    await generateNotifications()
    await generateAdditionalDomains()

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 GENERATION SUMMARY')
    console.log('='.repeat(60))

    let totalCreated = 0
    let totalErrors = 0

    for (const stat of stats) {
      const domainName = stat.domain.padEnd(25)
      const createdStr = String(stat.created).padStart(3)
      const errorsStr = stat.errors > 0 ? `  ❌ ${stat.errors}` : ''
      console.log(`  ${domainName} ✅ ${createdStr}${errorsStr}`)
      totalCreated += stat.created
      totalErrors += stat.errors
    }

    console.log('='.repeat(60))
    console.log(`  TOTAL RECORDS CREATED:     ✅ ${totalCreated}`)
    console.log(`  TOTAL ERRORS:              ${totalErrors > 0 ? '❌' : '✅'} ${totalErrors}`)
    console.log('='.repeat(60))

    if (totalErrors === 0) {
      console.log('\n🎉 SUCCESS! All test data generated successfully!')
      console.log('\n📋 Next Steps:')
      console.log('   1. Log in to LifeHub with this user ID')
      console.log('   2. Visit the Command Center dashboard')
      console.log('   3. Check domain pages (Financial, Health, Insurance, etc.)')
      console.log('   4. Verify all metrics are showing real data (no more zeros!)')
      console.log('\n🔗 User ID for login: ' + TEST_USER_ID)
    } else {
      console.log(`\n⚠️  Completed with ${totalErrors} errors. Check logs above.`)
    }

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main as generateComprehensiveSeedData }
