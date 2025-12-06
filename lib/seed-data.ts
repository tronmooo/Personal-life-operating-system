/**
 * Comprehensive seed data for all domains
 * This provides realistic sample data for new users
 */

export function generateSeedData() {
  const now = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]
  
  return {
    financial: [
      // Accounts
      {
        id: crypto.randomUUID(),
        title: 'Chase Checking',
        description: 'Primary checking account',
        metadata: {
          type: 'account',
          itemType: 'account',
          accountType: 'checking',
          balance: 5000,
          institution: 'Chase',
          isActive: true,
          color: '#10B981',
          icon: '💰',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Savings Account',
        description: 'Emergency fund',
        metadata: {
          type: 'account',
          itemType: 'account',
          accountType: 'savings',
          balance: 15000,
          institution: 'Chase',
          isActive: true,
          color: '#3B82F6',
          icon: '🏦',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Credit Card',
        description: 'Chase Sapphire',
        metadata: {
          type: 'account',
          itemType: 'account',
          accountType: 'credit',
          balance: -2500,
          creditLimit: 10000,
          institution: 'Chase',
          isActive: true,
          color: '#EF4444',
          icon: '💳',
        },
        createdAt: now,
        updatedAt: now,
      },
      // Transactions
      {
        id: crypto.randomUUID(),
        title: 'Monthly Salary',
        description: 'Salary deposit',
        metadata: {
          type: 'income',
          amount: 5000,
          description: 'Monthly salary',
          timestamp: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Grocery Shopping',
        description: 'Whole Foods',
        metadata: {
          type: 'expense',
          amount: 150,
          description: 'Grocery shopping at Whole Foods',
          timestamp: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Gas',
        description: 'Shell Station',
        metadata: {
          type: 'expense',
          amount: 45,
          description: 'Gas at Shell',
          timestamp: now,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    health: [
      {
        id: crypto.randomUUID(),
        title: 'Morning Vitals',
        description: 'Daily health check',
        metadata: {
          recordType: 'Fitness',
          weight: 180,
          heartRate: 72,
          systolic: 120,
          diastolic: 80,
          glucose: 95,
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Multivitamin',
        description: 'Daily supplement',
        metadata: {
          recordType: 'Medication',
          name: 'Multivitamin',
          dosage: '1 tablet',
          frequency: 'daily',
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    home: [
      {
        id: crypto.randomUUID(),
        title: '123 Main Street',
        description: '123 Main St, San Francisco, CA 94102',
        metadata: {
          type: 'property',
          propertyValue: 850000,
          address: '123 Main St, San Francisco, CA 94102',
          propertyType: 'primary',
          purchaseDate: '2020-01-15',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Change AC Filter',
        description: 'Replace HVAC air filter',
        metadata: {
          itemType: 'maintenance-task',
          type: 'home-maintenance',
          status: 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    vehicles: [
      {
        id: crypto.randomUUID(),
        title: '2020 Honda Civic',
        description: 'Primary vehicle',
        metadata: {
          type: 'vehicle',
          make: 'Honda',
          model: 'Civic',
          year: 2020,
          value: 23000,
          estimatedValue: 23000,
          mileage: 45000,
          vin: '1HGBH41JXMN109186',
          needsService: false,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    nutrition: [
      {
        id: crypto.randomUUID(),
        title: 'Breakfast - Oatmeal & Eggs',
        description: 'Morning meal',
        metadata: {
          itemType: 'meal',
          mealType: 'breakfast',
          calories: 450,
          protein: 25,
          carbs: 50,
          fat: 15,
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Lunch - Chicken Salad',
        description: 'Afternoon meal',
        metadata: {
          itemType: 'meal',
          mealType: 'lunch',
          calories: 550,
          protein: 40,
          carbs: 35,
          fat: 20,
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Water Intake',
        description: 'Daily hydration',
        metadata: {
          itemType: 'water',
          amount: 48,
          unit: 'oz',
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Daily Nutrition Goals',
        description: 'Target macros',
        metadata: {
          itemType: 'nutrition-goals',
          caloriesGoal: 2200,
          proteinGoal: 180,
          waterGoal: 80,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    fitness: [
      {
        id: crypto.randomUUID(),
        title: 'Morning Run',
        description: '5K run',
        metadata: {
          itemType: 'activity',
          activityType: 'Running',
          duration: 30,
          calories: 300,
          caloriesBurned: 300,
          steps: 5000,
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Strength Training',
        description: 'Upper body workout',
        metadata: {
          itemType: 'activity',
          activityType: 'Strength Training',
          duration: 45,
          calories: 250,
          caloriesBurned: 250,
          exercises: 'Bench press, rows, shoulder press',
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    insurance: [
      {
        id: crypto.randomUUID(),
        title: 'Health Insurance',
        description: 'Blue Cross Blue Shield',
        metadata: {
          type: 'health',
          monthlyPremium: 450,
          provider: 'Blue Cross Blue Shield',
          policyNumber: 'HC123456',
          expiryDate: '2026-12-31',
          renewalDate: '2026-12-31',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Auto Insurance',
        description: 'State Farm',
        metadata: {
          type: 'auto',
          monthlyPremium: 150,
          provider: 'State Farm',
          policyNumber: 'AUTO789',
          expiryDate: '2026-06-30',
          renewalDate: '2026-06-30',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Home Insurance',
        description: 'Allstate',
        metadata: {
          type: 'home',
          monthlyPremium: 120,
          provider: 'Allstate',
          policyNumber: 'HOME456',
          expiryDate: '2026-03-15',
          renewalDate: '2026-03-15',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Life Insurance',
        description: 'Northwestern Mutual',
        metadata: {
          type: 'life',
          monthlyPremium: 75,
          provider: 'Northwestern Mutual',
          policyNumber: 'LIFE321',
          expiryDate: '2050-01-01',
          renewalDate: '2050-01-01',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    utilities: [
      {
        id: crypto.randomUUID(),
        title: 'Electric - PG&E',
        description: 'Monthly electricity',
        metadata: {
          amount: 120,
          frequency: 'monthly',
          provider: 'PG&E',
          accountNumber: '123456',
          dueDate: '15',
          autoPayEnabled: true,
          status: 'paid',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Internet - Comcast',
        description: 'High-speed internet',
        metadata: {
          amount: 80,
          frequency: 'monthly',
          provider: 'Comcast',
          accountNumber: '789012',
          dueDate: '1',
          autoPayEnabled: true,
          status: 'paid',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Water - City Water',
        description: 'Municipal water service',
        metadata: {
          amount: 45,
          frequency: 'monthly',
          provider: 'City Water',
          accountNumber: '345678',
          dueDate: '20',
          autoPayEnabled: false,
          status: 'unpaid',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Gas - PG&E',
        description: 'Natural gas',
        metadata: {
          amount: 35,
          frequency: 'monthly',
          provider: 'PG&E',
          accountNumber: '901234',
          dueDate: '15',
          autoPayEnabled: true,
          status: 'paid',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    collectibles: [
      {
        id: crypto.randomUUID(),
        title: 'Vintage Watch',
        description: 'Rolex Submariner 1960s',
        metadata: {
          category: 'Watches',
          currentValue: 15000,
          estimatedValue: 15000,
          purchasePrice: 8000,
          purchaseDate: '2018-05-20',
          isInsured: true,
          condition: 'Excellent',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    miscellaneous: [
      {
        id: crypto.randomUUID(),
        title: 'Bicycle',
        description: 'Trek Mountain Bike',
        metadata: {
          category: 'Sports Equipment',
          value: 1200,
          estimatedValue: 1200,
          purchaseDate: '2022-03-10',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    digital: [
      {
        id: crypto.randomUUID(),
        title: 'Netflix',
        description: 'Streaming service',
        metadata: {
          category: 'Subscription',
          type: 'subscription',
          monthlyCost: 15.99,
          cost: 15.99,
          renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: true,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Spotify',
        description: 'Music streaming',
        metadata: {
          category: 'Subscription',
          type: 'subscription',
          monthlyCost: 9.99,
          cost: 9.99,
          renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: true,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    pets: [
      {
        id: crypto.randomUUID(),
        title: 'Max',
        description: 'Golden Retriever',
        metadata: {
          species: 'Dog',
          breed: 'Golden Retriever',
          age: 3,
          weight: 70,
          birthDate: '2021-06-15',
          vaccines: [
            { name: 'Rabies', date: '2024-06-15', status: 'current' },
            { name: 'DHPP', date: '2024-06-15', status: 'current' },
          ],
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    mindfulness: [
      {
        id: crypto.randomUUID(),
        title: 'Morning Meditation',
        description: 'Guided meditation session',
        metadata: {
          entryType: 'Meditation',
          type: 'meditation',
          duration: 15,
          minutes: 15,
          date: now,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    appliances: [
      {
        id: crypto.randomUUID(),
        title: 'Refrigerator',
        description: 'Samsung French Door',
        metadata: {
          brand: 'Samsung',
          model: 'RF28R7351SR',
          purchaseDate: '2021-08-10',
          purchasePrice: 2500,
          value: 2500,
          warrantyExpiry: '2026-08-10',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    legal: [
      {
        id: crypto.randomUUID(),
        title: 'Driver License',
        description: 'California DL',
        metadata: {
          documentType: 'License',
          type: 'license',
          number: 'D1234567',
          expiryDate: '2028-10-15',
          renewalDate: '2028-10-15',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    
    relationships: [
      {
        id: crypto.randomUUID(),
        title: 'John Doe',
        description: 'Best friend',
        metadata: {
          relationship: 'Friend',
          birthday: '1990-05-20',
          phone: '555-0123',
          email: 'john@example.com',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
  }
}

















