/**
 * AI Assistant Command Fixtures
 * 
 * Comprehensive test fixtures derived from the LifeHub command catalog.
 * Source of truth: lib/ai/command-catalog.ts
 * 
 * Each fixture represents a natural language command that the AI assistant
 * should be able to process and route to the appropriate domain.
 */

import { VOICE_DOMAINS, VOICE_EXAMPLE_COMMANDS } from '@/lib/ai/command-catalog'

export type AssistantCommandFixture = {
  /** Short label identifying the test case */
  name: string
  /** Natural language user message (the input to test) */
  prompt: string
  /** Expected domain(s) the command should route to */
  domain: string | string[]
  /** Category of command for grouping */
  category?: 
    | 'health_metric'
    | 'fitness'
    | 'nutrition'
    | 'expense'
    | 'income'
    | 'bill'
    | 'vehicle'
    | 'pet'
    | 'home'
    | 'mindfulness'
    | 'task'
    | 'habit'
    | 'goal'
    | 'travel'
    | 'insurance'
    | 'legal'
    | 'appliances'
    | 'digital_life'
    | 'relationships'
    | 'hobbies'
    | 'navigation'
    | 'tool'
    | 'multi'
    | 'calendar'
  /** Optional: expected action type */
  expectedAction?: 'log' | 'add' | 'update' | 'query' | 'schedule' | 'navigate'
  /** Whether this is a multi-command (logs multiple things at once) */
  isMultiCommand?: boolean
  /** Description of what this test validates */
  description?: string
}

/**
 * ASSISTANT_COMMAND_FIXTURES
 * 
 * Comprehensive array of test fixtures covering all 21+ domains.
 * Built from the existing command catalog and voice command examples.
 */
export const ASSISTANT_COMMAND_FIXTURES: AssistantCommandFixture[] = [
  // ============================================
  // HEALTH DOMAIN - Weight, Water, Sleep, Steps, Mood, Blood Pressure
  // ============================================
  {
    name: 'Health - weight log',
    prompt: 'My weight is 175 pounds',
    domain: 'health',
    category: 'health_metric',
    expectedAction: 'log',
    description: 'Log body weight measurement',
  },
  {
    name: 'Health - water intake',
    prompt: 'Add water 16 ounces',
    domain: 'nutrition', // Water goes to nutrition domain
    category: 'nutrition',
    expectedAction: 'log',
    description: 'Log water consumption',
  },
  {
    name: 'Health - steps count',
    prompt: 'Log 10000 steps',
    domain: 'health',
    category: 'health_metric',
    expectedAction: 'log',
    description: 'Log daily step count',
  },
  {
    name: 'Health - sleep duration',
    prompt: 'I slept 7 hours last night',
    domain: 'health',
    category: 'health_metric',
    expectedAction: 'log',
    description: 'Log sleep duration',
  },
  {
    name: 'Health - mood tracking',
    prompt: 'Feeling great today, mood is 8 out of 10',
    domain: ['health', 'mindfulness'],
    category: 'health_metric',
    expectedAction: 'log',
    description: 'Log mood/emotional state',
  },
  {
    name: 'Health - blood pressure',
    prompt: 'Record blood pressure 120 over 80',
    domain: 'health',
    category: 'health_metric',
    expectedAction: 'log',
    description: 'Log blood pressure reading',
  },
  {
    name: 'Health - heart rate',
    prompt: 'Heart rate is 72 bpm',
    domain: 'health',
    category: 'health_metric',
    expectedAction: 'log',
    description: 'Log heart rate measurement',
  },

  // ============================================
  // FITNESS DOMAIN - Workouts, Strength Training
  // ============================================
  {
    name: 'Fitness - cardio workout',
    prompt: 'Did 30 minutes of cardio this morning',
    domain: 'fitness',
    category: 'fitness',
    expectedAction: 'log',
    description: 'Log cardio exercise session',
  },
  {
    name: 'Fitness - strength training',
    prompt: 'Bench press 3 sets of 10 reps at 135 pounds',
    domain: 'fitness',
    category: 'fitness',
    expectedAction: 'log',
    description: 'Log strength training exercise',
  },
  {
    name: 'Fitness - running',
    prompt: 'Ran 5 miles in 42 minutes',
    domain: 'fitness',
    category: 'fitness',
    expectedAction: 'log',
    description: 'Log running workout with distance and time',
  },
  {
    name: 'Fitness - gym session',
    prompt: 'Just finished an hour at the gym, did legs today',
    domain: 'fitness',
    category: 'fitness',
    expectedAction: 'log',
    description: 'Log general gym workout',
  },
  {
    name: 'Fitness - yoga',
    prompt: 'Completed 45 minute yoga session',
    domain: 'fitness',
    category: 'fitness',
    expectedAction: 'log',
    description: 'Log yoga practice',
  },

  // ============================================
  // NUTRITION DOMAIN - Meals, Calories, Protein
  // ============================================
  {
    name: 'Nutrition - meal with calories',
    prompt: 'Log meal chicken salad 450 calories',
    domain: 'nutrition',
    category: 'nutrition',
    expectedAction: 'log',
    description: 'Log meal with calorie count',
  },
  {
    name: 'Nutrition - breakfast',
    prompt: 'Had eggs and toast for breakfast, about 350 calories',
    domain: 'nutrition',
    category: 'nutrition',
    expectedAction: 'log',
    description: 'Log breakfast meal',
  },
  {
    name: 'Nutrition - protein intake',
    prompt: 'Ate a protein shake with 30g protein',
    domain: 'nutrition',
    category: 'nutrition',
    expectedAction: 'log',
    description: 'Log protein consumption',
  },
  {
    name: 'Nutrition - full macro log',
    prompt: 'Lunch was grilled chicken with rice - 500 calories, 40g protein, 50g carbs, 10g fat',
    domain: 'nutrition',
    category: 'nutrition',
    expectedAction: 'log',
    description: 'Log meal with full macronutrient breakdown',
  },
  {
    name: 'Nutrition - snack',
    prompt: 'Had an apple as a snack, 95 calories',
    domain: 'nutrition',
    category: 'nutrition',
    expectedAction: 'log',
    description: 'Log snack with calories',
  },

  // ============================================
  // FINANCIAL DOMAIN - Expenses, Income
  // ============================================
  {
    name: 'Financial - expense',
    prompt: 'Spent 50 dollars on groceries at Whole Foods',
    domain: 'financial',
    category: 'expense',
    expectedAction: 'log',
    description: 'Log expense transaction',
  },
  {
    name: 'Financial - income',
    prompt: 'Received paycheck of 3500 dollars',
    domain: 'financial',
    category: 'income',
    expectedAction: 'log',
    description: 'Log income deposit',
  },
  {
    name: 'Financial - bill payment',
    prompt: 'Paid electric bill $125',
    domain: 'financial',
    category: 'bill',
    expectedAction: 'log',
    description: 'Log bill payment',
  },
  {
    name: 'Financial - net worth query',
    prompt: "What's my net worth?",
    domain: 'financial',
    category: 'expense',
    expectedAction: 'query',
    description: 'Query financial summary',
  },
  {
    name: 'Financial - monthly spending query',
    prompt: 'How much did I spend this month?',
    domain: 'financial',
    category: 'expense',
    expectedAction: 'query',
    description: 'Query monthly expenses',
  },

  // ============================================
  // VEHICLES DOMAIN - Gas, Mileage, Maintenance
  // ============================================
  {
    name: 'Vehicle - gas fillup',
    prompt: 'Filled up gas, 15 gallons at $3.50 per gallon',
    domain: 'vehicles',
    category: 'vehicle',
    expectedAction: 'log',
    description: 'Log fuel purchase',
  },
  {
    name: 'Vehicle - mileage',
    prompt: 'Car odometer is at 52000 miles',
    domain: 'vehicles',
    category: 'vehicle',
    expectedAction: 'log',
    description: 'Log current mileage',
  },
  {
    name: 'Vehicle - oil change',
    prompt: 'Car oil change at 50000 miles',
    domain: 'vehicles',
    category: 'vehicle',
    expectedAction: 'log',
    description: 'Log maintenance - oil change',
  },
  {
    name: 'Vehicle - schedule service',
    prompt: 'Schedule car service next Tuesday',
    domain: ['vehicles', 'calendar'],
    category: 'vehicle',
    expectedAction: 'schedule',
    description: 'Schedule vehicle maintenance appointment',
  },
  {
    name: 'Vehicle - tire rotation',
    prompt: 'Got tires rotated today, cost $40',
    domain: 'vehicles',
    category: 'vehicle',
    expectedAction: 'log',
    description: 'Log tire service',
  },

  // ============================================
  // PETS DOMAIN - Feeding, Walking, Vet, Expenses
  // ============================================
  {
    name: 'Pet - feeding',
    prompt: 'Fed the dog at 6 PM',
    domain: 'pets',
    category: 'pet',
    expectedAction: 'log',
    description: 'Log pet feeding time',
  },
  {
    name: 'Pet - walking',
    prompt: 'Walked Max for 30 minutes this morning',
    domain: 'pets',
    category: 'pet',
    expectedAction: 'log',
    description: 'Log pet walk/exercise',
  },
  {
    name: 'Pet - vet appointment',
    prompt: 'Vet appointment for cat next week',
    domain: ['pets', 'calendar'],
    category: 'pet',
    expectedAction: 'schedule',
    description: 'Schedule vet appointment',
  },
  {
    name: 'Pet - expense',
    prompt: 'Spent $75 on dog food and treats',
    domain: ['pets', 'financial'],
    category: 'pet',
    expectedAction: 'log',
    description: 'Log pet-related expense',
  },
  {
    name: 'Pet - weight',
    prompt: 'Dog weighs 45 pounds',
    domain: 'pets',
    category: 'pet',
    expectedAction: 'log',
    description: 'Log pet weight',
  },

  // ============================================
  // HOME/PROPERTY DOMAIN - Utilities, Repairs, Rent/Mortgage
  // ============================================
  {
    name: 'Home - utility bill',
    prompt: 'Electric bill this month was $145',
    domain: ['home', 'financial'],
    category: 'home',
    expectedAction: 'log',
    description: 'Log utility expense',
  },
  {
    name: 'Home - repair',
    prompt: 'Fixed the leaky faucet in the bathroom',
    domain: 'home',
    category: 'home',
    expectedAction: 'log',
    description: 'Log home repair/maintenance',
  },
  {
    name: 'Home - rent payment',
    prompt: 'Paid rent $1800 for December',
    domain: ['home', 'financial'],
    category: 'home',
    expectedAction: 'log',
    description: 'Log rent payment',
  },
  {
    name: 'Home - maintenance schedule',
    prompt: 'HVAC maintenance due next month',
    domain: ['home', 'calendar'],
    category: 'home',
    expectedAction: 'schedule',
    description: 'Schedule home maintenance',
  },
  {
    name: 'Home - property value',
    prompt: 'House value is 500000 dollars',
    domain: ['home', 'property'],
    category: 'home',
    expectedAction: 'log',
    description: 'Log property valuation',
  },

  // ============================================
  // MINDFULNESS DOMAIN - Meditation, Journal, Notes
  // ============================================
  {
    name: 'Mindfulness - meditation',
    prompt: 'Meditated for 15 minutes this morning',
    domain: 'mindfulness',
    category: 'mindfulness',
    expectedAction: 'log',
    description: 'Log meditation session',
  },
  {
    name: 'Mindfulness - journal entry',
    prompt: "Today was a productive day, I feel accomplished after finishing the project. Need to remember to take more breaks though.",
    domain: 'mindfulness',
    category: 'mindfulness',
    expectedAction: 'log',
    description: 'Log journal entry',
  },
  {
    name: 'Mindfulness - stress level',
    prompt: 'Feeling stressed today, about a 7 out of 10',
    domain: 'mindfulness',
    category: 'mindfulness',
    expectedAction: 'log',
    description: 'Log stress level',
  },
  {
    name: 'Mindfulness - gratitude',
    prompt: 'Grateful for my family and the sunny weather today',
    domain: 'mindfulness',
    category: 'mindfulness',
    expectedAction: 'log',
    description: 'Log gratitude entry',
  },
  {
    name: 'Mindfulness - emotional venting',
    prompt: "I'm feeling overwhelmed with work deadlines and I don't know how to manage it all",
    domain: 'mindfulness',
    category: 'mindfulness',
    expectedAction: 'log',
    description: 'Log emotional journal entry',
  },

  // ============================================
  // TASKS DOMAIN - Create & Complete
  // ============================================
  {
    name: 'Task - create simple',
    prompt: 'Add task call dentist',
    domain: 'tasks',
    category: 'task',
    expectedAction: 'add',
    description: 'Create a simple task',
  },
  {
    name: 'Task - create with due date',
    prompt: 'Remind me to pay rent by the 1st of the month',
    domain: 'tasks',
    category: 'task',
    expectedAction: 'add',
    description: 'Create task with due date',
  },
  {
    name: 'Task - create with priority',
    prompt: 'High priority task: submit quarterly report',
    domain: 'tasks',
    category: 'task',
    expectedAction: 'add',
    description: 'Create task with priority',
  },
  {
    name: 'Task - complete',
    prompt: 'Mark task "buy groceries" as complete',
    domain: 'tasks',
    category: 'task',
    expectedAction: 'update',
    description: 'Complete an existing task',
  },
  {
    name: 'Task - todo reminder',
    prompt: 'Todo: pick up prescription tomorrow',
    domain: 'tasks',
    category: 'task',
    expectedAction: 'add',
    description: 'Create todo item',
  },

  // ============================================
  // HABITS DOMAIN - Create & Complete
  // ============================================
  {
    name: 'Habit - create',
    prompt: 'Create a habit to drink 8 glasses of water daily',
    domain: 'habits',
    category: 'habit',
    expectedAction: 'add',
    description: 'Create a new habit',
  },
  {
    name: 'Habit - complete',
    prompt: 'Completed morning routine habit',
    domain: 'habits',
    category: 'habit',
    expectedAction: 'log',
    description: 'Log habit completion',
  },
  {
    name: 'Habit - streak check',
    prompt: 'Did my reading habit today',
    domain: 'habits',
    category: 'habit',
    expectedAction: 'log',
    description: 'Log habit completion for streak',
  },

  // ============================================
  // GOALS DOMAIN - Create & Progress
  // ============================================
  {
    name: 'Goal - create',
    prompt: 'Set goal to read 50 books this year',
    domain: 'goals',
    category: 'goal',
    expectedAction: 'add',
    description: 'Create a new goal',
  },
  {
    name: 'Goal - progress update',
    prompt: 'Finished reading book 12 of my yearly goal',
    domain: 'goals',
    category: 'goal',
    expectedAction: 'update',
    description: 'Update goal progress',
  },
  {
    name: 'Goal - financial goal',
    prompt: 'Goal: save $10000 for emergency fund by end of year',
    domain: 'goals',
    category: 'goal',
    expectedAction: 'add',
    description: 'Create financial goal',
  },

  // ============================================
  // TRAVEL DOMAIN
  // ============================================
  {
    name: 'Travel - book flight',
    prompt: 'Booked flight to NYC for $350 round trip on January 15th',
    domain: 'travel',
    category: 'travel',
    expectedAction: 'log',
    description: 'Log flight booking',
  },
  {
    name: 'Travel - hotel booking',
    prompt: 'Reserved hotel room at Marriott for 3 nights, $450 total',
    domain: 'travel',
    category: 'travel',
    expectedAction: 'log',
    description: 'Log hotel reservation',
  },
  {
    name: 'Travel - trip planning',
    prompt: 'Planning trip to Europe in June',
    domain: 'travel',
    category: 'travel',
    expectedAction: 'add',
    description: 'Create trip plan',
  },

  // ============================================
  // INSURANCE DOMAIN
  // ============================================
  {
    name: 'Insurance - policy',
    prompt: 'Car insurance premium is $125 per month',
    domain: 'insurance',
    category: 'insurance',
    expectedAction: 'log',
    description: 'Log insurance policy details',
  },
  {
    name: 'Insurance - claim',
    prompt: 'Filed insurance claim for fender bender, claim #12345',
    domain: 'insurance',
    category: 'insurance',
    expectedAction: 'add',
    description: 'Log insurance claim',
  },
  {
    name: 'Insurance - renewal',
    prompt: 'Health insurance renews in March',
    domain: ['insurance', 'calendar'],
    category: 'insurance',
    expectedAction: 'log',
    description: 'Note insurance renewal date',
  },

  // ============================================
  // LEGAL DOMAIN
  // ============================================
  {
    name: 'Legal - document',
    prompt: 'Signed lease agreement for new apartment',
    domain: 'legal',
    category: 'legal',
    expectedAction: 'log',
    description: 'Log legal document',
  },
  {
    name: 'Legal - deadline',
    prompt: 'Tax filing deadline is April 15th',
    domain: ['legal', 'calendar'],
    category: 'legal',
    expectedAction: 'log',
    description: 'Log legal deadline',
  },

  // ============================================
  // APPLIANCES DOMAIN
  // ============================================
  {
    name: 'Appliances - warranty',
    prompt: 'Refrigerator warranty expires December 2025',
    domain: 'appliances',
    category: 'appliances',
    expectedAction: 'log',
    description: 'Log appliance warranty',
  },
  {
    name: 'Appliances - purchase',
    prompt: 'Bought new washing machine for $800',
    domain: ['appliances', 'financial'],
    category: 'appliances',
    expectedAction: 'add',
    description: 'Log new appliance purchase',
  },
  {
    name: 'Appliances - maintenance',
    prompt: 'Cleaned dryer vent today',
    domain: 'appliances',
    category: 'appliances',
    expectedAction: 'log',
    description: 'Log appliance maintenance',
  },

  // ============================================
  // DIGITAL LIFE DOMAIN
  // ============================================
  {
    name: 'Digital - subscription',
    prompt: 'Signed up for Netflix at $15.99 per month',
    domain: ['digital-life', 'financial'],
    category: 'digital_life',
    expectedAction: 'add',
    description: 'Log new subscription',
  },
  {
    name: 'Digital - password update',
    prompt: 'Updated password for bank account',
    domain: 'digital-life',
    category: 'digital_life',
    expectedAction: 'log',
    description: 'Note password update',
  },
  {
    name: 'Digital - account created',
    prompt: 'Created new account on LinkedIn',
    domain: 'digital-life',
    category: 'digital_life',
    expectedAction: 'add',
    description: 'Log new account',
  },

  // ============================================
  // RELATIONSHIPS DOMAIN
  // ============================================
  {
    name: 'Relationships - birthday',
    prompt: "Mom's birthday is March 5th",
    domain: 'relationships',
    category: 'relationships',
    expectedAction: 'log',
    description: 'Log contact birthday',
  },
  {
    name: 'Relationships - contact info',
    prompt: 'Added John as emergency contact, phone 555-123-4567',
    domain: 'relationships',
    category: 'relationships',
    expectedAction: 'add',
    description: 'Add contact information',
  },
  {
    name: 'Relationships - anniversary',
    prompt: 'Wedding anniversary is June 15th',
    domain: 'relationships',
    category: 'relationships',
    expectedAction: 'log',
    description: 'Log anniversary date',
  },

  // ============================================
  // HOBBIES DOMAIN
  // ============================================
  {
    name: 'Hobbies - activity',
    prompt: 'Played guitar for an hour today',
    domain: 'hobbies',
    category: 'hobbies',
    expectedAction: 'log',
    description: 'Log hobby activity',
  },
  {
    name: 'Hobbies - project',
    prompt: 'Started a new woodworking project - building a bookshelf',
    domain: 'hobbies',
    category: 'hobbies',
    expectedAction: 'add',
    description: 'Log hobby project',
  },
  {
    name: 'Hobbies - collection',
    prompt: 'Added new vinyl record to collection, paid $25',
    domain: ['hobbies', 'financial'],
    category: 'hobbies',
    expectedAction: 'log',
    description: 'Log collection item',
  },

  // ============================================
  // NAVIGATION COMMANDS
  // ============================================
  {
    name: 'Navigation - dashboard',
    prompt: 'Open dashboard',
    domain: 'app',
    category: 'navigation',
    expectedAction: 'navigate',
    description: 'Navigate to dashboard',
  },
  {
    name: 'Navigation - domain page',
    prompt: 'Go to health page',
    domain: 'app',
    category: 'navigation',
    expectedAction: 'navigate',
    description: 'Navigate to domain page',
  },
  {
    name: 'Navigation - settings',
    prompt: 'Open settings',
    domain: 'app',
    category: 'navigation',
    expectedAction: 'navigate',
    description: 'Navigate to settings',
  },
  {
    name: 'Navigation - show appointments',
    prompt: 'Show my appointments',
    domain: ['app', 'calendar'],
    category: 'navigation',
    expectedAction: 'query',
    description: 'View appointments/calendar',
  },

  // ============================================
  // TOOL COMMANDS
  // ============================================
  {
    name: 'Tool - BMI calculator',
    prompt: 'Open BMI calculator',
    domain: 'app',
    category: 'tool',
    expectedAction: 'navigate',
    description: 'Open BMI calculator tool',
  },
  {
    name: 'Tool - budget calculator',
    prompt: 'I need to use the budget calculator',
    domain: 'app',
    category: 'tool',
    expectedAction: 'navigate',
    description: 'Open budget calculator tool',
  },
  {
    name: 'Tool - mortgage calculator',
    prompt: 'Calculate mortgage for 400000 at 6.5 percent',
    domain: 'app',
    category: 'tool',
    expectedAction: 'navigate',
    description: 'Open mortgage calculator',
  },

  // ============================================
  // CALENDAR DOMAIN
  // ============================================
  {
    name: 'Calendar - interview',
    prompt: 'Interview at Amazon next Tuesday at 2:30 PM',
    domain: 'calendar',
    category: 'calendar',
    expectedAction: 'add',
    description: 'Schedule interview on calendar',
  },
  {
    name: 'Calendar - meeting',
    prompt: 'Meeting with John tomorrow at 3pm',
    domain: 'calendar',
    category: 'calendar',
    expectedAction: 'add',
    description: 'Schedule meeting',
  },
  {
    name: 'Calendar - appointment',
    prompt: 'Doctor appointment on Friday at 10am',
    domain: 'calendar',
    category: 'calendar',
    expectedAction: 'add',
    description: 'Schedule appointment',
  },

  // ============================================
  // MULTI-COMMAND TESTS (Log multiple things at once)
  // ============================================
  {
    name: 'Multi - health metrics combo',
    prompt: 'My weight is 175 pounds and log 10000 steps',
    domain: 'health',
    category: 'multi',
    isMultiCommand: true,
    description: 'Log weight and steps in single message',
  },
  {
    name: 'Multi - full health snapshot',
    prompt: 'Weight 175 lbs, blood pressure 118 over 76, drank 64 ounces of water, slept 7 hours, feeling good mood 8 out of 10',
    domain: ['health', 'nutrition', 'mindfulness'],
    category: 'multi',
    isMultiCommand: true,
    description: 'Comprehensive daily health log',
  },
  {
    name: 'Multi - workout and nutrition',
    prompt: 'Did 30 minutes cardio this morning, then had eggs and toast for breakfast about 400 calories',
    domain: ['fitness', 'nutrition'],
    category: 'multi',
    isMultiCommand: true,
    description: 'Log workout and meal together',
  },
  {
    name: 'Multi - financial day',
    prompt: 'Paid rent $1800, electric bill $125, and got groceries for $85',
    domain: 'financial',
    category: 'multi',
    isMultiCommand: true,
    description: 'Log multiple financial transactions',
  },
  {
    name: 'Multi - vehicle maintenance',
    prompt: 'Car service today: oil change $45, tire rotation $30, current mileage 52000',
    domain: 'vehicles',
    category: 'multi',
    isMultiCommand: true,
    description: 'Log multiple vehicle maintenance items',
  },
  {
    name: 'Multi - pet care day',
    prompt: 'Fed Max at 7am and 5pm, walked him for 45 minutes, bought new dog food for $55',
    domain: ['pets', 'financial'],
    category: 'multi',
    isMultiCommand: true,
    description: 'Log full day of pet care',
  },
  {
    name: 'Multi - daily complete log',
    prompt: 'Today: woke up at 6am after 8 hours sleep, ran 3 miles, had oatmeal 300 cal for breakfast, meditated 10 minutes, spent $12 on coffee, completed task to call mom',
    domain: ['health', 'fitness', 'nutrition', 'mindfulness', 'financial', 'tasks'],
    category: 'multi',
    isMultiCommand: true,
    description: 'Comprehensive daily activity log across multiple domains',
  },

  // ============================================
  // EDGE CASES AND VARIATIONS
  // ============================================
  {
    name: 'Edge - informal weight',
    prompt: 'I weigh about 180',
    domain: 'health',
    category: 'health_metric',
    description: 'Informal weight statement without units',
  },
  {
    name: 'Edge - shorthand meal',
    prompt: 'Lunch: pizza 600 cal',
    domain: 'nutrition',
    category: 'nutrition',
    description: 'Shorthand meal logging',
  },
  {
    name: 'Edge - past tense',
    prompt: 'Yesterday I walked 12000 steps and drank 8 glasses of water',
    domain: ['health', 'nutrition'],
    category: 'multi',
    isMultiCommand: true,
    description: 'Past tense multi-entry',
  },
  {
    name: 'Edge - conversational style',
    prompt: 'So I went to the gym this morning and did like an hour of weights, then grabbed a smoothie after',
    domain: ['fitness', 'nutrition'],
    category: 'multi',
    isMultiCommand: true,
    description: 'Conversational/casual input style',
  },
]

/**
 * Export domain list for validation
 */
export const SUPPORTED_DOMAINS = VOICE_DOMAINS

/**
 * Export example commands from catalog
 */
export const CATALOG_EXAMPLE_COMMANDS = VOICE_EXAMPLE_COMMANDS

/**
 * Get fixtures by category
 */
export function getFixturesByCategory(category: AssistantCommandFixture['category']) {
  return ASSISTANT_COMMAND_FIXTURES.filter(f => f.category === category)
}

/**
 * Get fixtures by domain
 */
export function getFixturesByDomain(domain: string) {
  return ASSISTANT_COMMAND_FIXTURES.filter(f => {
    if (Array.isArray(f.domain)) {
      return f.domain.includes(domain)
    }
    return f.domain === domain
  })
}

/**
 * Get only multi-command fixtures
 */
export function getMultiCommandFixtures() {
  return ASSISTANT_COMMAND_FIXTURES.filter(f => f.isMultiCommand)
}

/**
 * Get fixture count summary
 */
export function getFixtureSummary() {
  const byCategory: Record<string, number> = {}
  const byDomain: Record<string, number> = {}

  for (const fixture of ASSISTANT_COMMAND_FIXTURES) {
    // Count by category
    const cat = fixture.category || 'uncategorized'
    byCategory[cat] = (byCategory[cat] || 0) + 1

    // Count by domain
    const domains = Array.isArray(fixture.domain) ? fixture.domain : [fixture.domain]
    for (const d of domains) {
      byDomain[d] = (byDomain[d] || 0) + 1
    }
  }

  return {
    total: ASSISTANT_COMMAND_FIXTURES.length,
    byCategory,
    byDomain,
    multiCommandCount: getMultiCommandFixtures().length,
  }
}




