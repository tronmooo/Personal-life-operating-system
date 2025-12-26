// Domain-specific logging configurations
// Defines what can be quickly logged in each domain

export interface LogEntryField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'time' | 'datetime-local' | 'select' | 'textarea'
  placeholder?: string
  required?: boolean
  options?: string[]
  unit?: string // For display (e.g., "lbs", "$", "ml")
}

export interface LogEntryType {
  id: string
  name: string
  icon: string
  color: string
  fields: LogEntryField[]
  quickAdd?: boolean // Show in quick add dropdown
}

export interface DomainLoggingConfig {
  enabled: boolean
  logTypes: LogEntryType[]
}

export const DOMAIN_LOGGING_CONFIGS: Record<string, DomainLoggingConfig> = {
  // ==================== FINANCIAL ====================
  financial: {
    enabled: true,
    logTypes: [
      {
        id: 'expense',
        name: 'Expense',
        icon: '💸',
        color: 'red',
        quickAdd: true,
        fields: [
          { name: 'amount', label: 'Amount', type: 'number', unit: '$' },
          { name: 'category', label: 'Category', type: 'select', options: [
            'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
            'Healthcare', 'Housing', 'Personal Care', 'Education', 'Other'
          ]},
          { name: 'merchant', label: 'Merchant', type: 'text', placeholder: 'Where did you spend?' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details...' },
        ]
      },
      {
        id: 'income',
        name: 'Income',
        icon: '💰',
        color: 'green',
        quickAdd: true,
        fields: [
          { name: 'amount', label: 'Amount', type: 'number', unit: '$' },
          { name: 'source', label: 'Source', type: 'select', options: [
            'Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'
          ]},
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]
      },
    ]
  },

  // ==================== HEALTH ====================
  health: {
    enabled: true,
    logTypes: [
      {
        id: 'weight',
        name: 'Weight',
        icon: '⚖️',
        color: 'blue',
        quickAdd: true,
        fields: [
          { name: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'time', label: 'Time', type: 'time' },
          { name: 'notes', label: 'Notes', type: 'text', placeholder: 'Morning, after workout, etc.' },
        ]
      },
      {
        id: 'blood-pressure',
        name: 'Blood Pressure',
        icon: '🩸',
        color: 'red',
        quickAdd: true,
        fields: [
          { name: 'systolic', label: 'Systolic', type: 'number', placeholder: '120' },
          { name: 'diastolic', label: 'Diastolic', type: 'number', placeholder: '80' },
          { name: 'pulse', label: 'Pulse', type: 'number', placeholder: 'BPM' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'time', label: 'Time', type: 'time' },
        ]
      },
      {
        id: 'water-intake',
        name: 'Water Intake',
        icon: '💧',
        color: 'blue',
        quickAdd: true,
        fields: [
          { name: 'amount', label: 'Amount', type: 'number', unit: 'oz' },
          { name: 'time', label: 'Time', type: 'time' },
        ]
      },
      {
        id: 'symptom',
        name: 'Symptom Log',
        icon: '🤒',
        color: 'orange',
        fields: [
          { name: 'symptom', label: 'Symptom', type: 'text' },
          { name: 'severity', label: 'Severity', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'Description', type: 'textarea' },
        ]
      },
    ]
  },

  // ==================== NUTRITION ====================
  nutrition: {
    enabled: true,
    logTypes: [
      {
        id: 'meal',
        name: 'Meal',
        icon: '🍽️',
        color: 'green',
        quickAdd: true,
        fields: [
          { name: 'mealType', label: 'Meal Type', type: 'select', options: [
            'Breakfast', 'Lunch', 'Dinner', 'Snack'
          ]},
          { name: 'description', label: 'What did you eat?', type: 'textarea' },
          { name: 'calories', label: 'Calories', type: 'number', unit: 'cal' },
          { name: 'protein', label: 'Protein', type: 'number', unit: 'g' },
          { name: 'carbs', label: 'Carbs', type: 'number', unit: 'g' },
          { name: 'fat', label: 'Fat', type: 'number', unit: 'g' },
          { name: 'time', label: 'Time', type: 'time' },
        ]
      },
      {
        id: 'water',
        name: 'Water',
        icon: '💧',
        color: 'blue',
        quickAdd: true,
        fields: [
          { name: 'amount', label: 'Amount', type: 'number', unit: 'oz' },
          { name: 'time', label: 'Time', type: 'time' },
        ]
      },
    ]
  },

  // ==================== HOBBIES (Fitness) ====================
  hobbies: {
    enabled: true,
    logTypes: [
      {
        id: 'workout',
        name: 'Workout',
        icon: '💪',
        color: 'purple',
        quickAdd: true,
        fields: [
          { name: 'type', label: 'Workout Type', type: 'select', options: [
            'Cardio', 'Strength', 'Yoga', 'Sports', 'Walking', 'Running', 'Cycling', 'Swimming', 'Other'
          ]},
          { name: 'duration', label: 'Duration', type: 'number', unit: 'min' },
          { name: 'intensity', label: 'Intensity', type: 'select', options: ['Light', 'Moderate', 'Intense'] },
          { name: 'calories', label: 'Calories Burned', type: 'number', unit: 'cal' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Exercises, sets, reps...' },
        ]
      },
      {
        id: 'steps',
        name: 'Daily Steps',
        icon: '👟',
        color: 'blue',
        quickAdd: true,
        fields: [
          { name: 'steps', label: 'Steps', type: 'number' },
          { name: 'distance', label: 'Distance', type: 'number', unit: 'miles' },
          { name: 'date', label: 'Date', type: 'date' },
        ]
      },
    ]
  },

  // ==================== VEHICLES ====================
  vehicles: {
    enabled: true,
    logTypes: [
      {
        id: 'fuel',
        name: 'Fuel Fill-up',
        icon: '⛽',
        color: 'orange',
        quickAdd: true,
        fields: [
          { name: 'vehicle', label: 'Vehicle', type: 'text' },
          { name: 'gallons', label: 'Gallons', type: 'number', unit: 'gal' },
          { name: 'cost', label: 'Total Cost', type: 'number', unit: '$' },
          { name: 'mileage', label: 'Current Mileage', type: 'number' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'station', label: 'Gas Station', type: 'text' },
        ]
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        icon: '🔧',
        color: 'blue',
        fields: [
          { name: 'vehicle', label: 'Vehicle', type: 'text' },
          { name: 'type', label: 'Service Type', type: 'select', options: [
            'Oil Change', 'Tire Rotation', 'Brake Service', 'Inspection', 'Repair', 'Other'
          ]},
          { name: 'cost', label: 'Cost', type: 'number', unit: '$' },
          { name: 'mileage', label: 'Mileage', type: 'number' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'provider', label: 'Service Provider', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]
      },
    ]
  },


  // ==================== PETS ====================
  pets: {
    enabled: true,
    logTypes: [
      {
        id: 'feeding',
        name: 'Feeding',
        icon: '🍖',
        color: 'orange',
        quickAdd: true,
        fields: [
          { name: 'pet', label: 'Pet Name', type: 'text' },
          { name: 'food', label: 'Food Type', type: 'text' },
          { name: 'amount', label: 'Amount', type: 'text', placeholder: 'e.g., 1 cup' },
          { name: 'time', label: 'Time', type: 'time' },
        ]
      },
      {
        id: 'weight',
        name: 'Weight Check',
        icon: '⚖️',
        color: 'blue',
        fields: [
          { name: 'pet', label: 'Pet Name', type: 'text' },
          { name: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
          { name: 'date', label: 'Date', type: 'date' },
        ]
      },
      {
        id: 'vet',
        name: 'Vet Visit',
        icon: '🏥',
        color: 'red',
        fields: [
          { name: 'pet', label: 'Pet Name', type: 'text' },
          { name: 'reason', label: 'Reason', type: 'text' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'cost', label: 'Cost', type: 'number', unit: '$' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]
      },
    ]
  },


  // ==================== RELATIONSHIPS ====================
  relationships: {
    enabled: true,
    logTypes: [
      {
        id: 'interaction',
        name: 'Interaction',
        icon: '💬',
        color: 'pink',
        quickAdd: true,
        fields: [
          { name: 'person', label: 'Person', type: 'text' },
          { name: 'type', label: 'Type', type: 'select', options: [
            'In-Person', 'Phone Call', 'Video Call', 'Text/Message', 'Email'
          ]},
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What did you talk about?' },
        ]
      },
    ]
  },

  // ==================== HOME ====================
  home: {
    enabled: true,
    logTypes: [
      {
        id: 'maintenance',
        name: 'Maintenance Task',
        icon: '🔨',
        color: 'orange',
        quickAdd: true,
        fields: [
          { name: 'task', label: 'Task', type: 'text' },
          { name: 'area', label: 'Area', type: 'select', options: [
            'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Exterior', 'Garage', 'Yard', 'Other'
          ]},
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'cost', label: 'Cost', type: 'number', unit: '$' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]
      },
    ]
  },

  // ==================== GOALS ====================
  goals: {
    enabled: true,
    logTypes: [
      {
        id: 'progress',
        name: 'Progress Update',
        icon: '📈',
        color: 'green',
        quickAdd: true,
        fields: [
          { name: 'goal', label: 'Goal', type: 'text' },
          { name: 'progress', label: 'Progress %', type: 'number', unit: '%' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'What did you achieve?', type: 'textarea' },
        ]
      },
    ]
  },

  // ==================== SHOPPING ====================
  shopping: {
    enabled: true,
    logTypes: [
      {
        id: 'purchase',
        name: 'Purchase',
        icon: '🛍️',
        color: 'pink',
        quickAdd: true,
        fields: [
          { name: 'item', label: 'Item', type: 'text' },
          { name: 'amount', label: 'Amount', type: 'number', unit: '$' },
          { name: 'store', label: 'Store', type: 'text' },
          { name: 'category', label: 'Category', type: 'select', options: [
            'Clothing', 'Electronics', 'Home Goods', 'Books', 'Hobbies', 'Gifts', 'Other'
          ]},
          { name: 'date', label: 'Date', type: 'date' },
        ]
      },
    ]
  },

  // ==================== ENTERTAINMENT ====================
  entertainment: {
    enabled: true,
    logTypes: [
      {
        id: 'movie',
        name: 'Movie/Show',
        icon: '🎬',
        color: 'purple',
        quickAdd: true,
        fields: [
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'type', label: 'Type', type: 'select', options: ['Movie', 'TV Show', 'Documentary', 'Other'] },
          { name: 'rating', label: 'Your Rating', type: 'select', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐', '⭐'] },
          { name: 'date', label: 'Date Watched', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]
      },
    ]
  },

  // ==================== MINDFULNESS ====================
  mindfulness: {
    enabled: true,
    logTypes: [
      {
        id: 'journal',
        name: 'Journal Entry',
        icon: '📔',
        color: 'purple',
        quickAdd: true,
        fields: [
          { name: 'title', label: 'Title', type: 'text', placeholder: 'Today was...' },
          { name: 'entry', label: 'Journal Entry', type: 'textarea', placeholder: 'What\'s on your mind?' },
          { name: 'mood', label: 'Mood', type: 'select', options: [
            '😊 Amazing', '😄 Happy', '😌 Content', '😐 Neutral', '😔 Sad', '😢 Very Sad', '😠 Angry', '😰 Anxious', '😴 Tired', '🤒 Unwell'
          ]},
          { name: 'energy', label: 'Energy Level', type: 'select', options: ['High', 'Medium', 'Low'] },
          { name: 'gratitude', label: 'Grateful For', type: 'textarea', placeholder: 'What are you grateful for today?' },
          { name: 'date', label: 'Date', type: 'date' },
        ]
      },
      {
        id: 'meditation',
        name: 'Meditation',
        icon: '🧘',
        color: 'blue',
        quickAdd: true,
        fields: [
          { name: 'duration', label: 'Duration', type: 'number', unit: 'min' },
          { name: 'type', label: 'Type', type: 'select', options: [
            'Mindfulness', 'Breathing', 'Guided', 'Body Scan', 'Loving-Kindness', 'Transcendental', 'Other'
          ]},
          { name: 'mood_before', label: 'Mood Before', type: 'select', options: [
            '😊 Amazing', '😄 Happy', '😌 Content', '😐 Neutral', '😔 Sad', '😰 Anxious', '😴 Tired'
          ]},
          { name: 'mood_after', label: 'Mood After', type: 'select', options: [
            '😊 Amazing', '😄 Happy', '😌 Content', '😐 Neutral', '😔 Sad', '😰 Anxious', '😴 Tired'
          ]},
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'How was the session?' },
        ]
      },
      {
        id: 'affirmation',
        name: 'Affirmation',
        icon: '💭',
        color: 'pink',
        fields: [
          { name: 'affirmation', label: 'Affirmation', type: 'textarea', placeholder: 'I am...' },
          { name: 'category', label: 'Category', type: 'select', options: [
            'Self-Love', 'Confidence', 'Success', 'Health', 'Peace', 'Gratitude', 'Abundance', 'Other'
          ]},
          { name: 'time', label: 'Time', type: 'time' },
        ]
      },
    ]
  },

  // ==================== APPLIANCES ====================
  appliances: {
    enabled: true,
    logTypes: [
      {
        id: 'maintenance',
        name: 'Maintenance',
        icon: '🔧',
        color: 'orange',
        quickAdd: true,
        fields: [
          { name: 'appliance', label: 'Appliance', type: 'text', placeholder: 'e.g., Refrigerator, Washer' },
          { name: 'type', label: 'Maintenance Type', type: 'select', options: [
            'Cleaning', 'Filter Change', 'Repair', 'Inspection', 'Calibration', 'Other'
          ]},
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'cost', label: 'Cost', type: 'number', unit: '$' },
          { name: 'technician', label: 'Technician/Service', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What was done?' },
        ]
      },
      {
        id: 'issue',
        name: 'Issue/Problem',
        icon: '⚠️',
        color: 'red',
        fields: [
          { name: 'appliance', label: 'Appliance', type: 'text' },
          { name: 'issue', label: 'Issue Description', type: 'textarea', placeholder: 'What\'s wrong?' },
          { name: 'severity', label: 'Severity', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
          { name: 'date', label: 'Date Noticed', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: ['Reported', 'In Progress', 'Resolved', 'Needs Replacement'] },
        ]
      },
    ]
  },
}

// Domains without logging (static data only)
export const NO_LOGGING_DOMAINS = [
  'insurance', // Static policies
  'legal', // Static documents
  'utilities', // Static accounts
  'technology', // Static devices/services
  'community', // Static memberships
  'spirituality', // Practices (could add later)
  'environment', // Actions (could add later)
]

// EXPANDED Domain Logging - ALL Trackable Metrics with Visualizations
// This expands the base config with 50+ new log types

// Add new health metrics
DOMAIN_LOGGING_CONFIGS.health.logTypes.push(
  {
    id: 'heart-rate',
    name: 'Heart Rate',
    icon: '❤️',
    color: 'red',
    quickAdd: true,
    fields: [
      { name: 'bpm', label: 'Heart Rate', type: 'number', unit: 'BPM' },
      { name: 'type', label: 'Type', type: 'select', options: ['Resting', 'Active', 'Post-Exercise'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time' },
    ]
  },
  {
    id: 'blood-sugar',
    name: 'Blood Sugar',
    icon: '🩸',
    color: 'red',
    fields: [
      { name: 'level', label: 'Blood Sugar', type: 'number', unit: 'mg/dL' },
      { name: 'time_of_day', label: 'When', type: 'select', options: ['Fasting', 'Before Meal', 'After Meal', 'Bedtime'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time' },
    ]
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '😴',
    color: 'purple',
    quickAdd: true,
    fields: [
      { name: 'hours', label: 'Hours Slept', type: 'number', unit: 'hrs' },
      { name: 'quality', label: 'Sleep Quality', type: 'select', options: [
        'Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'
      ]},
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Dreams, wake-ups, etc.' },
    ]
  },
  {
    id: 'mood',
    name: 'Mood Check',
    icon: '😊',
    color: 'yellow',
    quickAdd: true,
    fields: [
      { name: 'mood', label: 'Mood', type: 'select', options: [
        '10 - Euphoric', '9 - Very Happy', '8 - Happy', '7 - Good', '6 - Okay',
        '5 - Neutral', '4 - Low', '3 - Sad', '2 - Very Sad', '1 - Depressed'
      ]},
      { name: 'energy', label: 'Energy', type: 'select', options: ['High', 'Medium', 'Low'] },
      { name: 'stress', label: 'Stress Level', type: 'select', options: ['None', 'Low', 'Moderate', 'High', 'Very High'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time' },
    ]
  },
  {
    id: 'body-measurements',
    name: 'Body Measurements',
    icon: '📏',
    color: 'blue',
    fields: [
      { name: 'waist', label: 'Waist', type: 'number', unit: 'inches' },
      { name: 'chest', label: 'Chest', type: 'number', unit: 'inches' },
      { name: 'arms', label: 'Arms', type: 'number', unit: 'inches' },
      { name: 'hips', label: 'Hips', type: 'number', unit: 'inches' },
      { name: 'thighs', label: 'Thighs', type: 'number', unit: 'inches' },
      { name: 'date', label: 'Date', type: 'date' },
    ]
  },
  {
    id: 'medication',
    name: 'Medication Taken',
    icon: '💊',
    color: 'green',
    quickAdd: true,
    fields: [
      { name: 'medication', label: 'Medication Name', type: 'text' },
      { name: 'dosage', label: 'Dosage', type: 'text', placeholder: 'e.g., 10mg' },
      { name: 'taken', label: 'Taken?', type: 'select', options: ['Yes', 'No', 'Forgot'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time' },
    ]
  },
  {
    id: 'pain',
    name: 'Pain Log',
    icon: '🤕',
    color: 'red',
    fields: [
      { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Lower back' },
      { name: 'severity', label: 'Severity (1-10)', type: 'number' },
      { name: 'type', label: 'Pain Type', type: 'select', options: [
        'Sharp', 'Dull', 'Throbbing', 'Burning', 'Stabbing', 'Aching'
      ]},
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  }
)

// Add comprehensive nutrition tracking
DOMAIN_LOGGING_CONFIGS.nutrition.logTypes.push(
  {
    id: 'supplement',
    name: 'Supplement',
    icon: '💊',
    color: 'green',
    quickAdd: true,
    fields: [
      { name: 'supplement', label: 'Supplement Name', type: 'text' },
      { name: 'dosage', label: 'Dosage', type: 'text', placeholder: 'e.g., 1000mg' },
      { name: 'time', label: 'Time', type: 'time' },
    ]
  },
  {
    id: 'craving',
    name: 'Food Craving',
    icon: '🍫',
    color: 'orange',
    fields: [
      { name: 'food', label: 'Food Craved', type: 'text' },
      { name: 'intensity', label: 'Intensity', type: 'select', options: ['Mild', 'Moderate', 'Strong', 'Irresistible'] },
      { name: 'satisfied', label: 'Did you eat it?', type: 'select', options: ['Yes', 'No', 'Partially'] },
      { name: 'time', label: 'Time', type: 'time' },
      { name: 'notes', label: 'Trigger/Context', type: 'textarea' },
    ]
  },
  {
    id: 'weight-log',
    name: 'Weight (Nutrition)',
    icon: '⚖️',
    color: 'blue',
    quickAdd: true,
    fields: [
      { name: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time' },
    ]
  }
)

// Add advanced fitness tracking
DOMAIN_LOGGING_CONFIGS.hobbies.logTypes.push(
  {
    id: 'strength',
    name: 'Strength Progress',
    icon: '🏋️',
    color: 'red',
    quickAdd: true,
    fields: [
      { name: 'exercise', label: 'Exercise', type: 'text', placeholder: 'e.g., Bench Press' },
      { name: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
      { name: 'reps', label: 'Reps', type: 'number' },
      { name: 'sets', label: 'Sets', type: 'number' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'text', placeholder: 'Form, difficulty, etc.' },
    ]
  },
  {
    id: 'flexibility',
    name: 'Flexibility Score',
    icon: '🧘‍♀️',
    color: 'purple',
    fields: [
      { name: 'test', label: 'Flexibility Test', type: 'text', placeholder: 'e.g., Sit and Reach' },
      { name: 'score', label: 'Score/Distance', type: 'number', unit: 'inches' },
      { name: 'date', label: 'Date', type: 'date' },
    ]
  },
  {
    id: 'cardio-detail',
    name: 'Cardio Session',
    icon: '🏃',
    color: 'orange',
    quickAdd: true,
    fields: [
      { name: 'activity', label: 'Activity', type: 'select', options: [
        'Running', 'Cycling', 'Swimming', 'Rowing', 'Elliptical', 'Stairs', 'Jump Rope', 'Other'
      ]},
      { name: 'distance', label: 'Distance', type: 'number', unit: 'miles' },
      { name: 'duration', label: 'Duration', type: 'number', unit: 'min' },
      { name: 'avg_heart_rate', label: 'Avg Heart Rate', type: 'number', unit: 'BPM' },
      { name: 'calories', label: 'Calories', type: 'number', unit: 'cal' },
      { name: 'date', label: 'Date', type: 'date' },
    ]
  }
)

// Add financial deep tracking
DOMAIN_LOGGING_CONFIGS.financial.logTypes.push(
  {
    id: 'investment',
    name: 'Investment Update',
    icon: '📈',
    color: 'green',
    quickAdd: true,
    fields: [
      { name: 'account', label: 'Account', type: 'text' },
      { name: 'value', label: 'Current Value', type: 'number', unit: '$' },
      { name: 'contribution', label: 'Contribution', type: 'number', unit: '$' },
      { name: 'date', label: 'Date', type: 'date' },
    ]
  },
  {
    id: 'net-worth',
    name: 'Net Worth Snapshot',
    icon: '💰',
    color: 'purple',
    fields: [
      { name: 'assets', label: 'Total Assets', type: 'number', unit: '$' },
      { name: 'liabilities', label: 'Total Liabilities', type: 'number', unit: '$' },
      { name: 'net_worth', label: 'Net Worth', type: 'number', unit: '$' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Major changes, etc.' },
    ]
  },
  {
    id: 'savings',
    name: 'Savings Rate',
    icon: '🐷',
    color: 'pink',
    fields: [
      { name: 'saved', label: 'Amount Saved', type: 'number', unit: '$' },
      { name: 'income', label: 'Total Income', type: 'number', unit: '$' },
      { name: 'rate', label: 'Savings Rate %', type: 'number', unit: '%' },
      { name: 'date', label: 'Date', type: 'date' },
    ]
  }
)

// Utilities domain removed (merged into Home)

// NEW DOMAIN: Digital Life subscriptions
DOMAIN_LOGGING_CONFIGS['digital-life'] = {
  enabled: true,
  logTypes: [
    {
      id: 'subscription-cost',
      name: 'Subscription Payment',
      icon: '💳',
      color: 'purple',
      quickAdd: true,
      fields: [
        { name: 'service', label: 'Service', type: 'text', required: true, placeholder: 'Netflix, Spotify, etc.' },
        { name: 'amount', label: 'Amount', type: 'number', required: true, unit: '$' },
        { name: 'date', label: 'Payment Date', type: 'date', required: true },
        { name: 'category', label: 'Category', type: 'select', options: [
          'Streaming', 'Software', 'Cloud Storage', 'Gaming', 'News', 'Education', 'Other'
        ]},
      ]
    }
  ]
}


