/**
 * Domain Field Schemas
 * 
 * Defines required and optional fields for each domain type.
 * Used by the AI assistant to intelligently request missing information
 * before saving entries.
 */

export interface FieldSchema {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'currency'
  required: boolean
  description?: string
  options?: string[]
  defaultValue?: any
  validate?: (value: any) => boolean
  followUpQuestion?: string
}

export interface DomainEntrySchema {
  domain: string
  itemType: string
  description: string
  fields: FieldSchema[]
}

// ============================================
// FINANCIAL DOMAIN SCHEMAS
// ============================================

export const FINANCIAL_SCHEMAS: Record<string, DomainEntrySchema> = {
  expense: {
    domain: 'financial',
    itemType: 'transaction',
    description: 'A one-time expense or purchase',
    fields: [
      { name: 'title', label: 'Description', type: 'text', required: true, followUpQuestion: 'What was this expense for?' },
      { name: 'amount', label: 'Amount', type: 'currency', required: true, followUpQuestion: 'How much did you spend?' },
      { name: 'category', label: 'Category', type: 'select', required: false, options: ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Personal', 'Travel', 'Other'], followUpQuestion: 'What category does this fall under?' },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
      { name: 'payee', label: 'Merchant/Payee', type: 'text', required: false },
    ]
  },
  income: {
    domain: 'financial',
    itemType: 'transaction',
    description: 'Income received',
    fields: [
      { name: 'title', label: 'Description', type: 'text', required: true, followUpQuestion: 'What was the source of income?' },
      { name: 'amount', label: 'Amount', type: 'currency', required: true, followUpQuestion: 'How much did you receive?' },
      { name: 'category', label: 'Category', type: 'select', required: false, options: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'] },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
      { name: 'payer', label: 'Source/Payer', type: 'text', required: false },
    ]
  },
  bill: {
    domain: 'financial',
    itemType: 'bill',
    description: 'A recurring or one-time bill',
    fields: [
      { name: 'name', label: 'Bill Name', type: 'text', required: true, followUpQuestion: 'What is the name of this bill?' },
      { name: 'amount', label: 'Amount', type: 'currency', required: true, followUpQuestion: 'How much is the bill amount?' },
      { name: 'category', label: 'Category', type: 'select', required: false, options: ['Subscription', 'Utility', 'Insurance', 'Rent/Mortgage', 'Phone/Internet', 'Streaming', 'Membership', 'Other'] },
      { name: 'recurring', label: 'Is Recurring', type: 'boolean', required: true, defaultValue: true, followUpQuestion: 'Is this a recurring bill (yes/no)?' },
      { name: 'frequency', label: 'Frequency', type: 'select', required: false, options: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'], followUpQuestion: 'How often is this billed (weekly, monthly, yearly)?' },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: false, followUpQuestion: 'When is this bill due?' },
      { name: 'provider', label: 'Provider', type: 'text', required: false },
      { name: 'isAutoPay', label: 'Auto Pay', type: 'boolean', required: false, defaultValue: false },
    ]
  },
  subscription: {
    domain: 'financial',
    itemType: 'bill',
    description: 'A subscription service',
    fields: [
      { name: 'name', label: 'Service Name', type: 'text', required: true, followUpQuestion: 'What is the subscription service name?' },
      { name: 'amount', label: 'Amount', type: 'currency', required: true, followUpQuestion: 'What is the subscription cost?' },
      { name: 'frequency', label: 'Billing Cycle', type: 'select', required: true, options: ['monthly', 'yearly'], followUpQuestion: 'Is this billed monthly or yearly?' },
      { name: 'category', label: 'Category', type: 'select', required: false, options: ['Streaming', 'Software', 'Music', 'Gaming', 'News', 'Fitness', 'Cloud Storage', 'Other'], followUpQuestion: 'What type of subscription is this (streaming, software, etc.)?' },
      { name: 'renewalDate', label: 'Renewal Date', type: 'date', required: false, followUpQuestion: 'When does the subscription renew?' },
      { name: 'isAutoPay', label: 'Auto Renews', type: 'boolean', required: false, defaultValue: true },
    ]
  },
  account: {
    domain: 'financial',
    itemType: 'account',
    description: 'A financial account',
    fields: [
      { name: 'name', label: 'Account Name', type: 'text', required: true, followUpQuestion: 'What would you like to call this account?' },
      { name: 'accountType', label: 'Account Type', type: 'select', required: true, options: ['checking', 'savings', 'credit-card', 'investment', 'retirement'], followUpQuestion: 'What type of account is this (checking, savings, credit card, investment)?' },
      { name: 'balance', label: 'Current Balance', type: 'currency', required: true, followUpQuestion: 'What is the current balance?' },
      { name: 'institution', label: 'Bank/Institution', type: 'text', required: false, followUpQuestion: 'Which bank or institution is this account with?' },
    ]
  },
  asset: {
    domain: 'financial',
    itemType: 'asset',
    description: 'A valuable asset',
    fields: [
      { name: 'name', label: 'Asset Name', type: 'text', required: true, followUpQuestion: 'What is the asset called?' },
      { name: 'assetType', label: 'Asset Type', type: 'select', required: true, options: ['real-estate', 'vehicle', 'jewelry', 'collectible', 'other'], followUpQuestion: 'What type of asset is this?' },
      { name: 'currentValue', label: 'Current Value', type: 'currency', required: true, followUpQuestion: 'What is the estimated current value?' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency', required: false },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: false },
    ]
  },
  debt: {
    domain: 'financial',
    itemType: 'debt',
    description: 'A debt or loan',
    fields: [
      { name: 'name', label: 'Debt Name', type: 'text', required: true, followUpQuestion: 'What is this debt for?' },
      { name: 'creditor', label: 'Creditor', type: 'text', required: true, followUpQuestion: 'Who is the lender/creditor?' },
      { name: 'currentBalance', label: 'Current Balance', type: 'currency', required: true, followUpQuestion: 'What is the current balance owed?' },
      { name: 'interestRate', label: 'Interest Rate', type: 'number', required: false, followUpQuestion: 'What is the interest rate (%)?' },
      { name: 'minimumPayment', label: 'Minimum Payment', type: 'currency', required: false, followUpQuestion: 'What is the minimum monthly payment?' },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
    ]
  },
  investment: {
    domain: 'financial',
    itemType: 'investment',
    description: 'An investment holding',
    fields: [
      { name: 'name', label: 'Investment Name', type: 'text', required: true, followUpQuestion: 'What is the investment name?' },
      { name: 'symbol', label: 'Ticker Symbol', type: 'text', required: false, followUpQuestion: 'What is the ticker symbol (if applicable)?' },
      { name: 'quantity', label: 'Quantity/Shares', type: 'number', required: true, followUpQuestion: 'How many shares/units do you own?' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency', required: true, followUpQuestion: 'What was the purchase price per share?' },
      { name: 'currentPrice', label: 'Current Price', type: 'currency', required: false },
      { name: 'investmentType', label: 'Type', type: 'select', required: false, options: ['stock', 'bond', 'etf', 'mutual-fund', 'crypto', 'other'] },
    ]
  },
  budget: {
    domain: 'financial',
    itemType: 'budget',
    description: 'A budget category',
    fields: [
      { name: 'category', label: 'Category Name', type: 'text', required: true, followUpQuestion: 'What budget category is this for?' },
      { name: 'budgetedAmount', label: 'Budget Amount', type: 'currency', required: true, followUpQuestion: 'How much do you want to budget for this category?' },
      { name: 'month', label: 'Month', type: 'text', required: false, defaultValue: 'current' },
    ]
  }
}

// ============================================
// HEALTH DOMAIN SCHEMAS
// ============================================

export const HEALTH_SCHEMAS: Record<string, DomainEntrySchema> = {
  weight: {
    domain: 'health',
    itemType: 'metric',
    description: 'Weight measurement',
    fields: [
      { name: 'value', label: 'Weight', type: 'number', required: true, followUpQuestion: 'What is your weight?' },
      { name: 'unit', label: 'Unit', type: 'select', required: false, options: ['lbs', 'kg'], defaultValue: 'lbs' },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
    ]
  },
  blood_pressure: {
    domain: 'health',
    itemType: 'metric',
    description: 'Blood pressure reading',
    fields: [
      { name: 'systolic', label: 'Systolic', type: 'number', required: true, followUpQuestion: 'What is the systolic (top number) reading?' },
      { name: 'diastolic', label: 'Diastolic', type: 'number', required: true, followUpQuestion: 'What is the diastolic (bottom number) reading?' },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
    ]
  },
  medication: {
    domain: 'health',
    itemType: 'medication',
    description: 'Medication tracking',
    fields: [
      { name: 'name', label: 'Medication Name', type: 'text', required: true, followUpQuestion: 'What is the medication name?' },
      { name: 'dosage', label: 'Dosage', type: 'text', required: false, followUpQuestion: 'What is the dosage?' },
      { name: 'frequency', label: 'Frequency', type: 'select', required: false, options: ['once daily', 'twice daily', 'as needed', 'weekly'], followUpQuestion: 'How often do you take it?' },
    ]
  },
  appointment: {
    domain: 'health',
    itemType: 'appointment',
    description: 'Medical appointment',
    fields: [
      { name: 'title', label: 'Appointment Type', type: 'text', required: true, followUpQuestion: 'What type of appointment is this?' },
      { name: 'provider', label: 'Doctor/Provider', type: 'text', required: false, followUpQuestion: 'Who is the doctor or provider?' },
      { name: 'date', label: 'Date', type: 'date', required: true, followUpQuestion: 'When is the appointment?' },
      { name: 'time', label: 'Time', type: 'text', required: false, followUpQuestion: 'What time is the appointment?' },
      { name: 'location', label: 'Location', type: 'text', required: false },
    ]
  }
}

// ============================================
// VEHICLE DOMAIN SCHEMAS
// ============================================

export const VEHICLE_SCHEMAS: Record<string, DomainEntrySchema> = {
  vehicle: {
    domain: 'vehicles',
    itemType: 'vehicle',
    description: 'A vehicle entry',
    fields: [
      { name: 'title', label: 'Vehicle Name', type: 'text', required: true, followUpQuestion: 'What would you like to call this vehicle?' },
      { name: 'make', label: 'Make', type: 'text', required: true, followUpQuestion: 'What is the make of the vehicle?' },
      { name: 'model', label: 'Model', type: 'text', required: true, followUpQuestion: 'What is the model?' },
      { name: 'year', label: 'Year', type: 'number', required: true, followUpQuestion: 'What year is it?' },
      { name: 'mileage', label: 'Current Mileage', type: 'number', required: false, followUpQuestion: 'What is the current mileage?' },
    ]
  },
  maintenance: {
    domain: 'vehicles',
    itemType: 'maintenance',
    description: 'Vehicle maintenance record',
    fields: [
      { name: 'serviceName', label: 'Service Type', type: 'text', required: true, followUpQuestion: 'What service was performed?' },
      { name: 'amount', label: 'Cost', type: 'currency', required: false, followUpQuestion: 'How much did it cost?' },
      { name: 'mileage', label: 'Mileage at Service', type: 'number', required: false },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
      { name: 'provider', label: 'Service Provider', type: 'text', required: false },
    ]
  },
  fuel: {
    domain: 'vehicles',
    itemType: 'fuel',
    description: 'Fuel purchase',
    fields: [
      { name: 'amount', label: 'Total Cost', type: 'currency', required: true, followUpQuestion: 'How much did you spend on fuel?' },
      { name: 'gallons', label: 'Gallons', type: 'number', required: false, followUpQuestion: 'How many gallons?' },
      { name: 'pricePerGallon', label: 'Price/Gallon', type: 'currency', required: false },
      { name: 'mileage', label: 'Current Mileage', type: 'number', required: false },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
    ]
  }
}

// ============================================
// PETS DOMAIN SCHEMAS
// ============================================

export const PET_SCHEMAS: Record<string, DomainEntrySchema> = {
  pet: {
    domain: 'pets',
    itemType: 'pet',
    description: 'A pet entry',
    fields: [
      { name: 'name', label: 'Pet Name', type: 'text', required: true, followUpQuestion: "What is your pet's name?" },
      { name: 'species', label: 'Species', type: 'select', required: true, options: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other'], followUpQuestion: 'What type of pet is it (dog, cat, etc.)?' },
      { name: 'breed', label: 'Breed', type: 'text', required: false, followUpQuestion: 'What breed?' },
      { name: 'birthDate', label: 'Birth Date', type: 'date', required: false, followUpQuestion: 'When was it born (approximately)?' },
    ]
  },
  vet_appointment: {
    domain: 'pets',
    itemType: 'vet_appointment',
    description: 'Veterinary appointment or expense',
    fields: [
      { name: 'petName', label: 'Pet Name', type: 'text', required: true, followUpQuestion: 'Which pet is this for?' },
      { name: 'type', label: 'Visit Type', type: 'select', required: false, options: ['Checkup', 'Vaccination', 'Emergency', 'Grooming', 'Surgery', 'Other'] },
      { name: 'amount', label: 'Cost', type: 'currency', required: false, followUpQuestion: 'How much did it cost?' },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
      { name: 'provider', label: 'Vet/Clinic', type: 'text', required: false },
    ]
  }
}

// ============================================
// HOME DOMAIN SCHEMAS
// ============================================

export const HOME_SCHEMAS: Record<string, DomainEntrySchema> = {
  property: {
    domain: 'home',
    itemType: 'property',
    description: 'A property',
    fields: [
      { name: 'title', label: 'Property Name', type: 'text', required: true, followUpQuestion: 'What would you like to call this property?' },
      { name: 'propertyType', label: 'Type', type: 'select', required: true, options: ['Primary Residence', 'Rental Property', 'Vacation Home', 'Investment'], followUpQuestion: 'What type of property is this?' },
      { name: 'propertyAddress', label: 'Address', type: 'text', required: false, followUpQuestion: 'What is the address?' },
      { name: 'currentValue', label: 'Current Value', type: 'currency', required: false, followUpQuestion: 'What is the estimated value?' },
    ]
  },
  maintenance: {
    domain: 'home',
    itemType: 'maintenance',
    description: 'Home maintenance task',
    fields: [
      { name: 'title', label: 'Task Name', type: 'text', required: true, followUpQuestion: 'What needs to be maintained?' },
      { name: 'category', label: 'Category', type: 'select', required: false, options: ['HVAC', 'Plumbing', 'Electrical', 'Appliances', 'Structure', 'Landscaping', 'Other'] },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: false, followUpQuestion: 'When is this due?' },
      { name: 'cost', label: 'Estimated Cost', type: 'currency', required: false },
      { name: 'recurring', label: 'Recurring', type: 'boolean', required: false },
    ]
  },
  expense: {
    domain: 'home',
    itemType: 'expense',
    description: 'Home expense (rent, utilities, repairs)',
    fields: [
      { name: 'title', label: 'Description', type: 'text', required: true, followUpQuestion: 'What is this expense for?' },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['rent', 'mortgage', 'utilities', 'repair', 'tax', 'insurance', 'other'], followUpQuestion: 'What category (rent, utilities, repair, etc.)?' },
      { name: 'amount', label: 'Amount', type: 'currency', required: true, followUpQuestion: 'How much was it?' },
      { name: 'date', label: 'Date', type: 'date', required: false, defaultValue: 'today' },
    ]
  }
}

// ============================================
// ALL SCHEMAS COMBINED
// ============================================

export const ALL_DOMAIN_SCHEMAS: Record<string, Record<string, DomainEntrySchema>> = {
  financial: FINANCIAL_SCHEMAS,
  health: HEALTH_SCHEMAS,
  vehicles: VEHICLE_SCHEMAS,
  pets: PET_SCHEMAS,
  home: HOME_SCHEMAS,
}

/**
 * Get schema for a specific domain and entry type
 */
export function getSchema(domain: string, entryType: string): DomainEntrySchema | null {
  const domainSchemas = ALL_DOMAIN_SCHEMAS[domain]
  if (!domainSchemas) return null
  return domainSchemas[entryType] || null
}

/**
 * Get all required fields that are missing from the provided data
 */
export function getMissingRequiredFields(schema: DomainEntrySchema, data: Record<string, any>): FieldSchema[] {
  return schema.fields.filter(field => {
    if (!field.required) return false
    const value = data[field.name]
    return value === undefined || value === null || value === ''
  })
}

/**
 * Generate follow-up questions for missing fields
 */
export function generateFollowUpQuestions(missingFields: FieldSchema[]): string {
  if (missingFields.length === 0) return ''
  
  if (missingFields.length === 1) {
    return missingFields[0].followUpQuestion || `What is the ${missingFields[0].label.toLowerCase()}?`
  }
  
  const questions = missingFields
    .map(f => f.followUpQuestion || `${f.label}`)
    .slice(0, 3) // Max 3 questions at once
  
  return `I need a few more details:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
}

/**
 * Detect the entry type from user message
 */
export function detectEntryType(domain: string, message: string): string | null {
  const lowerMessage = message.toLowerCase()
  
  if (domain === 'financial') {
    if (lowerMessage.includes('subscription')) return 'subscription'
    if (lowerMessage.includes('bill')) return 'bill'
    if (lowerMessage.includes('expense') || lowerMessage.includes('spent') || lowerMessage.includes('paid') || lowerMessage.includes('bought')) return 'expense'
    if (lowerMessage.includes('income') || lowerMessage.includes('earned') || lowerMessage.includes('received') || lowerMessage.includes('salary')) return 'income'
    if (lowerMessage.includes('account') || lowerMessage.includes('bank')) return 'account'
    if (lowerMessage.includes('debt') || lowerMessage.includes('loan') || lowerMessage.includes('owe')) return 'debt'
    if (lowerMessage.includes('investment') || lowerMessage.includes('stock') || lowerMessage.includes('shares')) return 'investment'
    if (lowerMessage.includes('asset')) return 'asset'
    if (lowerMessage.includes('budget')) return 'budget'
  }
  
  if (domain === 'health') {
    if (lowerMessage.includes('weight')) return 'weight'
    if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) return 'blood_pressure'
    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('prescription')) return 'medication'
    if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor') || lowerMessage.includes('checkup')) return 'appointment'
  }
  
  if (domain === 'vehicles') {
    if (lowerMessage.includes('maintenance') || lowerMessage.includes('service') || lowerMessage.includes('oil change') || lowerMessage.includes('repair')) return 'maintenance'
    if (lowerMessage.includes('gas') || lowerMessage.includes('fuel') || lowerMessage.includes('filled up')) return 'fuel'
    if (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('truck')) return 'vehicle'
  }
  
  if (domain === 'pets') {
    if (lowerMessage.includes('vet') || lowerMessage.includes('grooming') || lowerMessage.includes('pet expense')) return 'vet_appointment'
    return 'pet'
  }
  
  if (domain === 'home') {
    if (lowerMessage.includes('rent') || lowerMessage.includes('mortgage') || lowerMessage.includes('utilities')) return 'expense'
    if (lowerMessage.includes('maintenance') || lowerMessage.includes('repair')) return 'maintenance'
    if (lowerMessage.includes('property') || lowerMessage.includes('house') || lowerMessage.includes('home')) return 'property'
  }
  
  return null
}

/**
 * Apply default values to data
 */
export function applyDefaults(schema: DomainEntrySchema, data: Record<string, any>): Record<string, any> {
  const result = { ...data }
  
  for (const field of schema.fields) {
    if (result[field.name] === undefined && field.defaultValue !== undefined) {
      if (field.defaultValue === 'today') {
        result[field.name] = new Date().toISOString().split('T')[0]
      } else if (field.defaultValue === 'current') {
        const now = new Date()
        result[field.name] = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      } else {
        result[field.name] = field.defaultValue
      }
    }
  }
  
  return result
}



























