// Enhanced domain types with comprehensive sub-categories, documents, reminders, and metrics

export type SubCategory = 
  // Financial sub-categories
  | 'accounts' | 'transactions' | 'bills-recurring' | 'investments' | 'goals' | 'financial-documents' | 'financial-reminders' | 'financial-metrics'
  // Health sub-categories
  | 'medical-records' | 'medications' | 'vital-signs' | 'appointments' | 'health-insurance' | 'health-documents' | 'health-reminders' | 'health-metrics'
  // Career sub-categories
  | 'employment' | 'skills' | 'career-goals' | 'network' | 'applications' | 'career-documents' | 'career-reminders' | 'career-metrics'
  // Home sub-categories
  | 'property-details' | 'maintenance' | 'utilities' | 'home-inventory' | 'home-projects' | 'home-documents' | 'home-reminders' | 'home-metrics'
  // Vehicle sub-categories
  | 'vehicle-info' | 'vehicle-maintenance' | 'fuel' | 'registration' | 'auto-insurance' | 'vehicle-documents' | 'vehicle-reminders' | 'vehicle-metrics'
  // Insurance sub-categories
  | 'policies' | 'claims' | 'premiums' | 'coverage' | 'agents' | 'insurance-documents' | 'insurance-reminders' | 'insurance-metrics'
  // Pets sub-categories
  | 'pet-profiles' | 'pet-health' | 'food-supplies' | 'grooming' | 'training' | 'pet-documents' | 'pet-reminders' | 'pet-metrics'
  // Legal sub-categories
  | 'personal-documents' | 'legal-papers' | 'property-documents' | 'financial-documents' | 'business-documents' | 'document-storage' | 'legal-reminders' | 'legal-metrics'
  // Relationships sub-categories
  | 'contacts' | 'interactions' | 'important-dates' | 'gift-ideas' | 'activities' | 'relationship-documents' | 'relationship-reminders' | 'relationship-metrics'
  // Education sub-categories
  | 'courses' | 'certifications' | 'learning-skills' | 'institutions' | 'education-costs' | 'education-documents' | 'education-reminders' | 'education-metrics'
  // Travel sub-categories
  | 'trips' | 'bookings' | 'travel-documents' | 'travel-expenses' | 'preferences' | 'loyalty-programs' | 'travel-reminders' | 'travel-metrics'
  // Utilities sub-categories
  | 'services' | 'utility-accounts' | 'utility-bills' | 'meters' | 'outages' | 'utility-documents' | 'utility-reminders' | 'utility-metrics'
  // Digital Life sub-categories
  | 'online-accounts' | 'passwords' | 'subscriptions' | 'digital-assets' | 'social-media' | 'digital-documents' | 'digital-reminders' | 'digital-metrics'
  // Mindful sub-categories
  | 'meditation' | 'mood' | 'habits' | 'therapy' | 'stress-management' | 'mindful-documents' | 'mindful-reminders' | 'mindful-metrics'
  // Outdoor sub-categories
  | 'outdoor-activities' | 'equipment' | 'locations' | 'weather' | 'safety' | 'outdoor-documents' | 'outdoor-reminders' | 'outdoor-metrics'
  // Nutrition sub-categories
  | 'meals' | 'recipes' | 'supplements' | 'nutrition-goals' | 'shopping' | 'nutrition-documents' | 'nutrition-reminders' | 'nutrition-metrics'
  // Collectibles sub-categories
  | 'items' | 'valuations' | 'authentication' | 'storage' | 'collectible-insurance' | 'collectible-documents' | 'collectible-reminders' | 'collectible-metrics'
  // Appliances sub-categories
  | 'appliance-inventory' | 'warranties' | 'appliance-maintenance' | 'energy-usage' | 'manuals' | 'appliance-documents' | 'appliance-reminders' | 'appliance-metrics'
  // Schedule sub-categories
  | 'calendar-events' | 'recurring-items' | 'time-blocking' | 'conflicts' | 'productivity' | 'schedule-documents' | 'schedule-reminders' | 'schedule-metrics'
  // Planning sub-categories
  | 'planning-goals' | 'projects' | 'plans' | 'tasks' | 'resources' | 'planning-documents' | 'planning-reminders' | 'planning-metrics'

export interface EnhancedDomainData {
  id: string
  domain: string
  subCategory: SubCategory
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, any>
  documents?: DocumentAttachment[]
  reminders?: Reminder[]
  tags?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: string
}

export interface DocumentAttachment {
  id: string
  name: string
  type: 'pdf' | 'image' | 'doc' | 'spreadsheet' | 'other'
  size: number
  uploadedAt: string
  url?: string
  notes?: string
}

export interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: string
  type: 'one-time' | 'recurring'
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  status: 'pending' | 'completed' | 'snoozed'
  notifyBefore?: number // days before
}

export interface MetricDefinition {
  id: string
  name: string
  unit: string
  currentValue: number
  targetValue?: number
  history: { date: string; value: number }[]
}

// Financial Domain Sub-categories
export const FINANCIAL_CATEGORIES = {
  accounts: {
    name: 'Accounts',
    description: 'Bank accounts, credit cards, investments, retirement funds',
    fields: [
      { name: 'accountName', label: 'Account Name', type: 'text', required: true },
      { name: 'accountType', label: 'Account Type', type: 'select', options: ['Checking', 'Savings', 'Credit Card', 'Investment', 'Retirement', 'Money Market', 'CD'], required: true },
      { name: 'institution', label: 'Institution', type: 'text', required: true },
      { name: 'accountNumber', label: 'Account Number (Last 4)', type: 'text' },
      { name: 'currentBalance', label: 'Current Balance', type: 'currency', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number' },
      { name: 'openDate', label: 'Date Opened', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  transactions: {
    name: 'Transactions',
    description: 'Income, expenses, transfers, payments',
    fields: [
      { name: 'transactionDate', label: 'Transaction Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Income', 'Expense', 'Transfer', 'Payment', 'Refund'], required: true },
      { name: 'amount', label: 'Amount', type: 'currency', required: true },
      { name: 'account', label: 'Account', type: 'text' },
      { name: 'payee', label: 'Payee/Payer', type: 'text' },
      { name: 'subcategory', label: 'Subcategory', type: 'text' },
      { name: 'tags', label: 'Tags', type: 'text' },
      { name: 'receipt', label: 'Receipt Attached', type: 'checkbox' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  'bills-recurring': {
    name: 'Bills & Recurring',
    description: 'Monthly subscriptions, utilities, loan payments',
    fields: [
      { name: 'billName', label: 'Bill Name', type: 'text', required: true },
      { name: 'payee', label: 'Payee', type: 'text', required: true },
      { name: 'amount', label: 'Amount', type: 'currency', required: true },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Annually'], required: true },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { name: 'autoPay', label: 'Auto-Pay Enabled', type: 'checkbox' },
      { name: 'accountCharged', label: 'Account Charged', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Utilities', 'Subscriptions', 'Insurance', 'Loans', 'Rent/Mortgage', 'Other'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  investments: {
    name: 'Investments',
    description: 'Stocks, bonds, crypto, real estate',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: true },
      { name: 'investmentType', label: 'Type', type: 'select', options: ['Stocks', 'Bonds', 'Mutual Funds', 'ETFs', 'Cryptocurrency', 'Real Estate', 'Commodities', 'Other'], required: true },
      { name: 'symbol', label: 'Symbol/Ticker', type: 'text' },
      { name: 'quantity', label: 'Quantity/Shares', type: 'number' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
      { name: 'currentPrice', label: 'Current Price', type: 'currency' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'broker', label: 'Broker/Platform', type: 'text' },
      { name: 'accountNumber', label: 'Account Number', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  goals: {
    name: 'Financial Goals',
    description: 'Savings targets, debt payoff, retirement planning',
    fields: [
      { name: 'goalName', label: 'Goal Name', type: 'text', required: true },
      { name: 'goalType', label: 'Goal Type', type: 'select', options: ['Savings', 'Debt Payoff', 'Retirement', 'Investment', 'Emergency Fund', 'Large Purchase', 'Other'], required: true },
      { name: 'targetAmount', label: 'Target Amount', type: 'currency', required: true },
      { name: 'currentAmount', label: 'Current Amount', type: 'currency' },
      { name: 'targetDate', label: 'Target Date', type: 'date' },
      { name: 'monthlyContribution', label: 'Monthly Contribution', type: 'currency' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'On Track', 'Behind', 'Completed'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
}

// Health Domain Sub-categories
export const HEALTH_CATEGORIES = {
  'medical-records': {
    name: 'Medical Records',
    description: 'Doctor visits, test results, diagnoses, treatments',
    fields: [
      { name: 'visitDate', label: 'Visit Date', type: 'date', required: true },
      { name: 'provider', label: 'Healthcare Provider', type: 'text', required: true },
      { name: 'visitType', label: 'Visit Type', type: 'select', options: ['General Checkup', 'Specialist', 'Emergency', 'Follow-up', 'Procedure', 'Test'], required: true },
      { name: 'diagnosis', label: 'Diagnosis', type: 'text' },
      { name: 'treatment', label: 'Treatment', type: 'textarea' },
      { name: 'prescription', label: 'Prescriptions Given', type: 'textarea' },
      { name: 'followUp', label: 'Follow-up Required', type: 'checkbox' },
      { name: 'followUpDate', label: 'Follow-up Date', type: 'date' },
      { name: 'cost', label: 'Cost', type: 'currency' },
      { name: 'insuranceCovered', label: 'Insurance Covered', type: 'currency' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  medications: {
    name: 'Medications',
    description: 'Current prescriptions, dosages, schedules, side effects',
    fields: [
      { name: 'medicationName', label: 'Medication Name', type: 'text', required: true },
      { name: 'dosage', label: 'Dosage', type: 'text', required: true },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Weekly', 'Other'], required: true },
      { name: 'prescribedBy', label: 'Prescribed By', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'purpose', label: 'Purpose/Condition', type: 'text' },
      { name: 'sideEffects', label: 'Side Effects', type: 'textarea' },
      { name: 'pharmacy', label: 'Pharmacy', type: 'text' },
      { name: 'refillsRemaining', label: 'Refills Remaining', type: 'number' },
      { name: 'cost', label: 'Cost per Refill', type: 'currency' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  'vital-signs': {
    name: 'Vital Signs',
    description: 'Blood pressure, weight, heart rate, blood sugar',
    fields: [
      { name: 'recordDate', label: 'Date Recorded', type: 'date', required: true },
      { name: 'recordTime', label: 'Time', type: 'text' },
      { name: 'weight', label: 'Weight (lbs)', type: 'number' },
      { name: 'bloodPressureSystolic', label: 'Blood Pressure (Systolic)', type: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Blood Pressure (Diastolic)', type: 'number' },
      { name: 'heartRate', label: 'Heart Rate (bpm)', type: 'number' },
      { name: 'bloodSugar', label: 'Blood Sugar (mg/dL)', type: 'number' },
      { name: 'temperature', label: 'Temperature (°F)', type: 'number' },
      { name: 'oxygenSaturation', label: 'Oxygen Saturation (%)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
}

// Career Domain Sub-categories
export const CAREER_CATEGORIES = {
  employment: {
    name: 'Employment',
    description: 'Current job details, salary, benefits, performance reviews',
    fields: [
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'position', label: 'Position/Title', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'employmentType', label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'], required: true },
      { name: 'salary', label: 'Salary', type: 'currency' },
      { name: 'bonus', label: 'Bonus/Commission', type: 'currency' },
      { name: 'benefits', label: 'Benefits', type: 'textarea' },
      { name: 'manager', label: 'Manager Name', type: 'text' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'responsibilities', label: 'Key Responsibilities', type: 'textarea' },
      { name: 'achievements', label: 'Key Achievements', type: 'textarea' },
      { name: 'performanceRating', label: 'Latest Performance Rating', type: 'select', options: ['Exceeds Expectations', 'Meets Expectations', 'Needs Improvement'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  skills: {
    name: 'Skills & Certifications',
    description: 'Technical skills, certifications, training completed',
    fields: [
      { name: 'skillName', label: 'Skill/Certification Name', type: 'text', required: true },
      { name: 'skillType', label: 'Type', type: 'select', options: ['Technical Skill', 'Soft Skill', 'Certification', 'Language', 'Tool/Software'], required: true },
      { name: 'proficiency', label: 'Proficiency Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
      { name: 'acquiredDate', label: 'Date Acquired', type: 'date' },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { name: 'issuingOrganization', label: 'Issuing Organization', type: 'text' },
      { name: 'credentialID', label: 'Credential ID', type: 'text' },
      { name: 'verificationURL', label: 'Verification URL', type: 'text' },
      { name: 'relevantProjects', label: 'Relevant Projects', type: 'textarea' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
}

// Home Domain Sub-categories
export const HOME_CATEGORIES = {
  'property-details': {
    name: 'Property Details',
    description: 'Address, value, mortgage, taxes, insurance',
    fields: [
      { name: 'propertyAddress', label: 'Property Address', type: 'text', required: true },
      { name: 'propertyType', label: 'Property Type', type: 'select', options: ['Single Family', 'Condo', 'Townhouse', 'Apartment', 'Multi-family'], required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
      { name: 'currentValue', label: 'Current Value', type: 'currency' },
      { name: 'mortgageBalance', label: 'Mortgage Balance', type: 'currency' },
      { name: 'propertyTax', label: 'Annual Property Tax', type: 'currency' },
      { name: 'homeInsurance', label: 'Annual Home Insurance', type: 'currency' },
      { name: 'squareFeet', label: 'Square Feet', type: 'number' },
      { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  maintenance: {
    name: 'Maintenance',
    description: 'Repairs, upgrades, seasonal tasks, warranty info',
    fields: [
      { name: 'taskName', label: 'Task Name', type: 'text', required: true },
      { name: 'taskType', label: 'Task Type', type: 'select', options: ['Repair', 'Maintenance', 'Upgrade', 'Seasonal', 'Emergency'], required: true },
      { name: 'area', label: 'Area/Room', type: 'text' },
      { name: 'dateCompleted', label: 'Date Completed', type: 'date' },
      { name: 'nextDueDate', label: 'Next Due Date', type: 'date' },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['One-time', 'Monthly', 'Quarterly', 'Annually', 'As Needed'] },
      { name: 'contractor', label: 'Contractor/Company', type: 'text' },
      { name: 'cost', label: 'Cost', type: 'currency' },
      { name: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Scheduled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  'home-inventory': {
    name: 'Home Inventory',
    description: 'Appliances, furniture, valuable items, warranties',
    fields: [
      { name: 'itemName', label: 'Item Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Appliance', 'Furniture', 'Electronics', 'Decor', 'Tools', 'Other'], required: true },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'model', label: 'Model Number', type: 'text' },
      { name: 'serialNumber', label: 'Serial Number', type: 'text' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
      { name: 'currentValue', label: 'Current Value', type: 'currency' },
      { name: 'location', label: 'Location in Home', type: 'text' },
      { name: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  'home-projects': {
    name: 'Home Projects',
    description: 'Home improvements, renovation plans, contractor info',
    fields: [
      { name: 'projectName', label: 'Project Name', type: 'text', required: true },
      { name: 'projectType', label: 'Project Type', type: 'select', options: ['Renovation', 'Addition', 'Landscaping', 'Interior', 'Exterior', 'DIY'], required: true },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'targetEndDate', label: 'Target End Date', type: 'date' },
      { name: 'actualEndDate', label: 'Actual End Date', type: 'date' },
      { name: 'budget', label: 'Budget', type: 'currency' },
      { name: 'actualCost', label: 'Actual Cost', type: 'currency' },
      { name: 'contractor', label: 'Contractor', type: 'text' },
      { name: 'permitRequired', label: 'Permit Required', type: 'checkbox' },
      { name: 'permitNumber', label: 'Permit Number', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
}

// Vehicles Domain Sub-categories
export const VEHICLES_CATEGORIES = {
  'vehicle-info': {
    name: 'Vehicle Information',
    description: 'Make, model, year, VIN, registration, insurance',
    fields: [
      { name: 'vehicleName', label: 'Vehicle Name/Nickname', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
      { name: 'make', label: 'Make', type: 'text', required: true },
      { name: 'model', label: 'Model', type: 'text', required: true },
      { name: 'vin', label: 'VIN', type: 'text' },
      { name: 'licensePlate', label: 'License Plate', type: 'text' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
      { name: 'currentValue', label: 'Current Value', type: 'currency' },
      { name: 'currentMileage', label: 'Current Mileage', type: 'number' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  'vehicle-maintenance': {
    name: 'Maintenance',
    description: 'Oil changes, tire rotations, inspections, repairs',
    fields: [
      { name: 'serviceType', label: 'Service Type', type: 'select', options: ['Oil Change', 'Tire Rotation', 'Brake Service', 'Inspection', 'Repair', 'Tune-up', 'Other'], required: true },
      { name: 'serviceDate', label: 'Service Date', type: 'date', required: true },
      { name: 'mileageAtService', label: 'Mileage at Service', type: 'number' },
      { name: 'serviceName', label: 'Service Description', type: 'text', required: true },
      { name: 'serviceProvider', label: 'Service Provider', type: 'text' },
      { name: 'cost', label: 'Cost', type: 'currency' },
      { name: 'nextServiceMileage', label: 'Next Service Mileage', type: 'number' },
      { name: 'nextServiceDate', label: 'Next Service Date', type: 'date' },
      { name: 'partsReplaced', label: 'Parts Replaced', type: 'textarea' },
      { name: 'warrantyInfo', label: 'Warranty Info', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  fuel: {
    name: 'Fuel Tracking',
    description: 'Gas purchases, mileage, efficiency tracking',
    fields: [
      { name: 'fillDate', label: 'Fill Date', type: 'date', required: true },
      { name: 'mileage', label: 'Odometer Reading', type: 'number', required: true },
      { name: 'gallons', label: 'Gallons', type: 'number', required: true },
      { name: 'pricePerGallon', label: 'Price per Gallon', type: 'currency', required: true },
      { name: 'totalCost', label: 'Total Cost', type: 'currency' },
      { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Regular', 'Mid-grade', 'Premium', 'Diesel', 'Electric'] },
      { name: 'fullTank', label: 'Full Tank', type: 'checkbox' },
      { name: 'location', label: 'Gas Station/Location', type: 'text' },
      { name: 'mpg', label: 'MPG (calculated)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  registration: {
    name: 'Registration',
    description: 'License plates, renewals, inspections, taxes',
    fields: [
      { name: 'registrationType', label: 'Type', type: 'select', options: ['Registration', 'Inspection', 'Emission Test', 'License Renewal'], required: true },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { name: 'registrationNumber', label: 'Registration/Confirmation Number', type: 'text' },
      { name: 'cost', label: 'Cost', type: 'currency' },
      { name: 'issuingAuthority', label: 'Issuing Authority', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Expired', 'Pending Renewal'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
}

// Insurance Domain Sub-categories
export const INSURANCE_CATEGORIES = {
  policies: {
    name: 'Insurance Policies',
    description: 'Life, auto, home, health, disability, umbrella coverage',
    fields: [
      { name: 'policyName', label: 'Policy Name', type: 'text', required: true },
      { name: 'policyType', label: 'Policy Type', type: 'select', options: ['Auto', 'Home', 'Life', 'Health', 'Disability', 'Umbrella', 'Renters', 'Pet', 'Other'], required: true },
      { name: 'provider', label: 'Insurance Provider', type: 'text', required: true },
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'renewalDate', label: 'Renewal Date', type: 'date' },
      { name: 'premium', label: 'Premium Amount', type: 'currency' },
      { name: 'paymentFrequency', label: 'Payment Frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'] },
      { name: 'coverageAmount', label: 'Coverage Amount', type: 'currency' },
      { name: 'deductible', label: 'Deductible', type: 'currency' },
      { name: 'beneficiaries', label: 'Beneficiaries', type: 'text' },
      { name: 'agentName', label: 'Agent Name', type: 'text' },
      { name: 'agentPhone', label: 'Agent Phone', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Expired', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  claims: {
    name: 'Claims',
    description: 'Filed claims, status, payouts, documentation',
    fields: [
      { name: 'claimNumber', label: 'Claim Number', type: 'text', required: true },
      { name: 'policyType', label: 'Policy Type', type: 'select', options: ['Auto', 'Home', 'Health', 'Life', 'Other'], required: true },
      { name: 'dateOfIncident', label: 'Date of Incident', type: 'date', required: true },
      { name: 'dateFiledClaim', label: 'Date Claim Filed', type: 'date', required: true },
      { name: 'claimType', label: 'Claim Type', type: 'select', options: ['Accident', 'Theft', 'Damage', 'Medical', 'Liability', 'Other'] },
      { name: 'description', label: 'Incident Description', type: 'textarea', required: true },
      { name: 'claimAmount', label: 'Claim Amount', type: 'currency' },
      { name: 'approvedAmount', label: 'Approved Amount', type: 'currency' },
      { name: 'paidAmount', label: 'Paid Amount', type: 'currency' },
      { name: 'status', label: 'Status', type: 'select', options: ['Filed', 'Under Review', 'Approved', 'Denied', 'Paid', 'Closed'] },
      { name: 'adjusterName', label: 'Adjuster Name', type: 'text' },
      { name: 'adjusterPhone', label: 'Adjuster Phone', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  premiums: {
    name: 'Premium Payments',
    description: 'Payment schedules, amounts, payment methods',
    fields: [
      { name: 'policyName', label: 'Policy Name', type: 'text', required: true },
      { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
      { name: 'amount', label: 'Amount Paid', type: 'currency', required: true },
      { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Auto-Pay', 'Credit Card', 'Check', 'Bank Transfer', 'Cash'] },
      { name: 'confirmationNumber', label: 'Confirmation Number', type: 'text' },
      { name: 'nextPaymentDue', label: 'Next Payment Due', type: 'date' },
      { name: 'discountsApplied', label: 'Discounts Applied', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Paid', 'Pending', 'Overdue', 'Scheduled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  coverage: {
    name: 'Coverage Details',
    description: 'Limits, deductibles, beneficiaries, terms',
    fields: [
      { name: 'policyName', label: 'Policy Name', type: 'text', required: true },
      { name: 'coverageType', label: 'Coverage Type', type: 'text', required: true },
      { name: 'coverageLimit', label: 'Coverage Limit', type: 'currency' },
      { name: 'deductible', label: 'Deductible', type: 'currency' },
      { name: 'copay', label: 'Copay', type: 'currency' },
      { name: 'coinsurance', label: 'Coinsurance (%)', type: 'number' },
      { name: 'outOfPocketMax', label: 'Out of Pocket Max', type: 'currency' },
      { name: 'coverageIncludes', label: 'Coverage Includes', type: 'textarea' },
      { name: 'coverageExcludes', label: 'Coverage Excludes', type: 'textarea' },
      { name: 'beneficiaries', label: 'Beneficiaries', type: 'textarea' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
}

export const ENHANCED_DOMAIN_CATEGORIES = {
  financial: FINANCIAL_CATEGORIES,
  health: HEALTH_CATEGORIES,
  career: CAREER_CATEGORIES,
  home: HOME_CATEGORIES,
  vehicles: VEHICLES_CATEGORIES,
  insurance: INSURANCE_CATEGORIES,
}

