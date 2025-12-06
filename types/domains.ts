export type Domain =
  | 'financial'
  | 'health'
  | 'insurance'
  | 'home'
  | 'vehicles'
  | 'appliances'
  | 'pets'
  | 'relationships'
  | 'digital'
  | 'mindfulness'
  | 'fitness'
  | 'nutrition'
  | 'services'
  | 'miscellaneous'

import type { DomainMetadataMap } from './domain-metadata'

export interface DomainData<D extends Domain = Domain> {
  id: string
  domain: D
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  metadata: DomainMetadataMap[D]
}

export interface DomainConfig {
  id: Domain
  name: string
  description: string
  icon: string
  color: string
  category: 'core' | 'assets' | 'personal' | 'planning' | 'lifestyle'
  fields: DomainField[]
}

export interface DomainField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'currency' | 'time'
  required?: boolean
  options?: string[]
  placeholder?: string
}

export const DOMAIN_CONFIGS: Record<Domain, DomainConfig> = {
  financial: {
    id: 'financial',
    name: 'Financial',
    description: 'Track accounts, budgets, investments, and transactions',
    icon: 'DollarSign',
    color: 'bg-green-500',
    category: 'core',
    fields: [
      { name: 'accountName', label: 'Account Name', type: 'text', required: true },
      { name: 'accountType', label: 'Account Type', type: 'select', options: ['Checking', 'Savings', 'Investment', 'Credit Card', 'Loan'], required: true },
      { name: 'balance', label: 'Balance', type: 'currency', required: true },
      { name: 'institution', label: 'Institution', type: 'text' },
    ],
  },
  health: {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Medical records, fitness tracking, and medication management',
    icon: 'Heart',
    color: 'bg-red-500',
    category: 'core',
    fields: [
      { name: 'recordType', label: 'Record Type', type: 'select', options: ['Medical', 'Fitness', 'Medication', 'Lab Result'], required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  insurance: {
    id: 'insurance',
    name: 'Document Manager',
    description: 'Insurance policies, legal documents, contracts, and compliance',
    icon: 'Shield',
    color: 'bg-purple-500',
    category: 'core',
    fields: [
      // Item Type
      { name: 'itemType', label: 'Item Type', type: 'select', required: true, 
        options: ['Insurance Policy', 'Legal Document', 'Contract', 'License', 'Certificate'] },
      
      // Insurance Fields
      { name: 'policyType', label: 'Policy Type', type: 'select', 
        options: ['Auto', 'Home', 'Life', 'Health', 'Disability', 'Umbrella', 'Business', 'Other'] },
      { name: 'provider', label: 'Provider/Company', type: 'text' },
      { name: 'policyNumber', label: 'Policy/Document Number', type: 'text' },
      { name: 'premium', label: 'Premium/Annual Cost', type: 'currency' },
      { name: 'deductible', label: 'Deductible', type: 'currency' },
      { name: 'coverageAmount', label: 'Coverage Amount', type: 'currency' },
      
      // Legal Document Fields
      { name: 'documentName', label: 'Document Name', type: 'text' },
      { name: 'documentType', label: 'Document Type', type: 'select', 
        options: ['Will', 'Trust', 'Power of Attorney', 'Deed', 'Title', 'Contract', 'License', 'Permit', 'Certificate', 'Court Order', 'Other'] },
      { name: 'attorney', label: 'Attorney/Contact', type: 'text' },
      { name: 'caseNumber', label: 'Case/File Number', type: 'text' },
      
      // Dates
      { name: 'issueDate', label: 'Issue/Start Date', type: 'date' },
      { name: 'renewalDate', label: 'Renewal Date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry/End Date', type: 'date' },
      
      // Universal Fields
      { name: 'status', label: 'Status', type: 'select', 
        options: ['Active', 'Pending', 'Expired', 'Cancelled', 'Under Review'] },
      { name: 'beneficiaries', label: 'Beneficiaries', type: 'text', placeholder: 'Names of beneficiaries' },
      { name: 'attachments', label: 'Document URL/Path', type: 'text', placeholder: 'Link to stored document' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'reminderDays', label: 'Remind Before Expiry (Days)', type: 'number', placeholder: '30' },
    ],
  },
  home: {
    id: 'home',
    name: 'Home Management',
    description: 'Comprehensive home maintenance, assets, projects, and documents',
    icon: 'Home',
    color: 'bg-orange-500',
    category: 'assets',
    fields: [
      // Item Classification
      { name: 'itemType', label: 'Item Type', type: 'select', required: true,
        options: ['Maintenance Task', 'Asset/Warranty', 'Project', 'Property', 'Document', 'Service Provider'] },
      { name: 'title', label: 'Title/Name', type: 'text', required: true, placeholder: 'HVAC Filter Change' },
      { name: 'category', label: 'Category', type: 'select',
        options: ['HVAC', 'Plumbing', 'Electrical', 'Appliances', 'Structure', 'Landscaping', 'Security', 'Other'] },
      { name: 'location', label: 'Location/Room', type: 'text', placeholder: 'Basement, Kitchen, etc.' },
      
      // Maintenance Task Fields
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'lastCompleted', label: 'Last Completed', type: 'date' },
      { name: 'recurring', label: 'Recurring Task', type: 'checkbox' },
      { name: 'frequency', label: 'Frequency', type: 'select',
        options: ['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Bi-Annually', 'Annually'] },
      { name: 'priority', label: 'Priority', type: 'select',
        options: ['Low', 'Medium', 'High', 'Urgent'] },
      { name: 'status', label: 'Status', type: 'select',
        options: ['Pending', 'In Progress', 'Completed', 'Overdue', 'On Hold', 'Cancelled'] },
      
      // Asset/Warranty Fields
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'warrantyExpires', label: 'Warranty Expires', type: 'date' },
      { name: 'manufacturer', label: 'Manufacturer/Brand', type: 'text' },
      { name: 'modelNumber', label: 'Model Number', type: 'text' },
      { name: 'serialNumber', label: 'Serial Number', type: 'text' },
      { name: 'condition', label: 'Condition', type: 'select',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'] },
      
      // Project Fields
      { name: 'projectStatus', label: 'Project Status', type: 'select',
        options: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'targetDate', label: 'Target Completion', type: 'date' },
      { name: 'completedDate', label: 'Completed Date', type: 'date' },
      { name: 'budget', label: 'Budget', type: 'currency' },
      { name: 'actualCost', label: 'Actual Cost', type: 'currency' },
      { name: 'progressPercent', label: 'Progress (%)', type: 'number', placeholder: '0-100' },
      
      // Property Fields
      { name: 'propertyAddress', label: 'Property Address', type: 'textarea', placeholder: 'Full address' },
      { name: 'propertyType', label: 'Property Type', type: 'select',
        options: ['Primary Residence', 'Rental Property', 'Vacation Home', 'Investment', 'Commercial'] },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
      { name: 'currentValue', label: 'Current Estimated Value', type: 'currency' },
      { name: 'mortgageBalance', label: 'Mortgage Balance', type: 'currency' },
      { name: 'propertyTax', label: 'Annual Property Tax', type: 'currency' },
      { name: 'squareFeet', label: 'Square Footage', type: 'number' },
      { name: 'yearBuilt', label: 'Year Built', type: 'number' },
      
      // Document Fields
      { name: 'documentType', label: 'Document Type', type: 'select',
        options: ['Deed', 'Title', 'Mortgage', 'Insurance', 'Warranty', 'Manual', 'Receipt', 'Contract', 'Permit', 'Other'] },
      { name: 'documentUrl', label: 'Document URL/Link', type: 'text', placeholder: 'Link to stored document' },
      { name: 'expirationDate', label: 'Expiration Date', type: 'date' },
      
      // Service Provider Fields
      { name: 'providerName', label: 'Company/Provider Name', type: 'text' },
      { name: 'serviceType', label: 'Service Type', type: 'text', placeholder: 'Plumber, Electrician, etc.' },
      { name: 'contactPhone', label: 'Phone', type: 'text' },
      { name: 'contactEmail', label: 'Email', type: 'text' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', placeholder: '1-5' },
      { name: 'lastServiceDate', label: 'Last Service Date', type: 'date' },
      { name: 'website', label: 'Website', type: 'text' },
      
      // Financial Tracking
      { name: 'estimatedCost', label: 'Estimated Cost', type: 'currency' },
      { name: 'cost', label: 'Actual Cost', type: 'currency' },
      { name: 'paidDate', label: 'Date Paid', type: 'date' },
      
      // Universal Fields
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details, instructions, history...' },
      { name: 'attachments', label: 'Attachments', type: 'text', placeholder: 'URLs to photos, receipts, manuals' },
      { name: 'tags', label: 'Tags', type: 'text', placeholder: 'seasonal, emergency, professional-needed' },
      { name: 'reminderDays', label: 'Remind Me (Days Before)', type: 'number', placeholder: '7' },
    ],
  },
  vehicles: {
    id: 'vehicles',
    name: 'Vehicles',
    description: 'Maintenance logs, registration, and fuel tracking',
    icon: 'Car',
    color: 'bg-indigo-500',
    category: 'assets',
    fields: [
      { name: 'make', label: 'Make', type: 'text', required: true },
      { name: 'model', label: 'Model', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
      { name: 'mileage', label: 'Mileage', type: 'number' },
      { name: 'serviceType', label: 'Service Type', type: 'select', options: ['Oil Change', 'Tire Rotation', 'Inspection', 'Repair', 'Other'] },
    ],
  },
  appliances: {
    id: 'appliances',
    name: 'Assets',
    description: 'Track valuable assets, warranties, and maintenance schedules',
    icon: 'Refrigerator',
    color: 'bg-teal-500',
    category: 'assets',
    fields: [
      { name: 'name', label: 'Asset Name', type: 'text', required: true },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'serialNumber', label: 'Serial Number', type: 'text' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
      { name: 'value', label: 'Current Value', type: 'currency' },
      { name: 'cost', label: 'Maintenance Cost', type: 'currency' },
      { name: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
      { name: 'warrantyType', label: 'Warranty Type', type: 'select', options: ['Manufacturer', 'Extended', 'Store', 'None'] },
      { name: 'maintenanceDue', label: 'Next Maintenance Date', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Repair'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  pets: {
    id: 'pets',
    name: 'Pets',
    description: 'Health records, vet appointments, vaccinations',
    icon: 'PawPrint',
    color: 'bg-amber-500',
    category: 'personal',
    fields: [
      { name: 'petName', label: 'Pet Name', type: 'text', required: true },
      { name: 'species', label: 'Species', type: 'select', options: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'], required: true },
      { name: 'breed', label: 'Breed', type: 'text' },
      { name: 'birthDate', label: 'Birth Date', type: 'date' },
      { name: 'vetName', label: 'Vet Name', type: 'text' },
    ],
  },
  relationships: {
    id: 'relationships',
    name: 'Relationships',
    description: 'Track important people, dates, and connections in your life',
    icon: 'Users',
    color: 'bg-rose-500',
    category: 'personal',
    fields: [
      // Core Person Info
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
      { name: 'relationshipType', label: 'Relationship Type', type: 'select', required: true, 
        options: ['Family', 'Partner/Spouse', 'Close Friend', 'Friend', 'Colleague', 'Mentor', 'Acquaintance', 'Other'] },
      { name: 'photo', label: 'Photo URL', type: 'text', placeholder: 'https://...' },
      
      // Important Dates
      { name: 'birthday', label: 'Birthday', type: 'date' },
      { name: 'anniversaryDate', label: 'Anniversary Date', type: 'date', placeholder: 'For partners/spouses' },
      { name: 'firstMetDate', label: 'Date First Met', type: 'date' },
      { name: 'otherImportantDate1', label: 'Other Important Date', type: 'date' },
      { name: 'otherDateLabel1', label: 'Date Description', type: 'text', placeholder: 'e.g., Graduation, Retirement' },
      { name: 'otherImportantDate2', label: 'Another Important Date', type: 'date' },
      { name: 'otherDateLabel2', label: 'Date Description', type: 'text', placeholder: 'e.g., Death Anniversary, etc.' },
      
      // Connection Details
      { name: 'howWeMet', label: 'How We Met', type: 'textarea', placeholder: 'Story of how you met...' },
      { name: 'lastContact', label: 'Last Contact Date', type: 'date' },
      { name: 'frequency', label: 'Contact Frequency Goal', type: 'select', 
        options: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Yearly', 'Special Occasions'] },
      
      // Contact Info
      { name: 'email', label: 'Email', type: 'text', placeholder: 'john@example.com' },
      { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' },
      { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Street, City, State, ZIP' },
      { name: 'socialMedia', label: 'Social Media', type: 'text', placeholder: '@username or profile link' },
      
      // Gift & Preference Tracking
      { name: 'giftIdeas', label: 'Gift Ideas', type: 'textarea', placeholder: 'Things they like, wish list items...' },
      { name: 'interests', label: 'Interests & Hobbies', type: 'textarea', placeholder: 'What they enjoy...' },
      { name: 'favorites', label: 'Favorites', type: 'textarea', placeholder: 'Favorite color, food, activities...' },
      
      // Reminders & Tracking
      { name: 'sentGift', label: 'Sent Gift This Year', type: 'checkbox' },
      { name: 'sentCard', label: 'Sent Card This Year', type: 'checkbox' },
      { name: 'reminderDaysBefore', label: 'Remind Me (Days Before)', type: 'number', placeholder: '7' },
      
      // Notes
      { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any other important details...' },
      { name: 'tags', label: 'Tags', type: 'text', placeholder: 'family, close-friend, work' },
    ],
  },
  digital: {
    id: 'digital',
    name: 'Digital Life',
    description: 'Subscriptions, passwords, and digital assets',
    icon: 'Laptop',
    color: 'bg-gray-500',
    category: 'lifestyle',
    fields: [
      { name: 'serviceName', label: 'Service Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Subscription', 'Software', 'Domain', 'Cloud Storage', 'Other'] },
      { name: 'monthlyCost', label: 'Monthly Cost', type: 'currency' },
      { name: 'renewalDate', label: 'Renewal Date', type: 'date' },
      { name: 'username', label: 'Username', type: 'text' },
    ],
  },
  mindfulness: {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Meditation, journal entries, gratitude log',
    icon: 'Brain',
    color: 'bg-emerald-500',
    category: 'lifestyle',
    fields: [
      { name: 'entryType', label: 'Entry Type', type: 'select', options: ['Meditation', 'Journal', 'Gratitude', 'Reflection'], required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'duration', label: 'Duration (minutes)', type: 'number' },
      { name: 'mood', label: 'Mood', type: 'select', options: ['Great', 'Good', 'Okay', 'Low', 'Poor'] },
      { name: 'entry', label: 'Entry', type: 'textarea' },
    ],
  },
  fitness: {
    id: 'fitness',
    name: 'Workout',
    description: 'Track your workouts, steps, and progress',
    icon: 'Activity',
    color: 'bg-indigo-600',
    category: 'lifestyle',
    fields: [
      { name: 'activityType', label: 'Activity Type', type: 'select', options: ['Running', 'Cycling', 'Swimming', 'Yoga', 'Strength Training', 'Walking', 'Other'], required: true },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', required: true },
      { name: 'calories', label: 'Calories Burned', type: 'number' },
      { name: 'steps', label: 'Steps', type: 'number' },
      { name: 'distance', label: 'Distance (miles)', type: 'number' },
      { name: 'exercises', label: 'Exercises/Machines', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  nutrition: {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Meal planning, recipes, dietary tracking',
    icon: 'Utensils',
    color: 'bg-orange-600',
    category: 'lifestyle',
    fields: [
      { name: 'mealName', label: 'Meal Name', type: 'text', required: true },
      { name: 'mealType', label: 'Meal Type', type: 'select', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], required: true },
      { name: 'calories', label: 'Calories', type: 'number' },
      { name: 'protein', label: 'Protein (g)', type: 'number' },
      { name: 'carbs', label: 'Carbs (g)', type: 'number' },
      { name: 'fat', label: 'Fat (g)', type: 'number' },
    ],
  },
  services: {
    id: 'services',
    name: 'Service Providers',
    description: 'Track insurance, utilities, internet, mobile and other service providers',
    icon: 'Zap',
    color: 'bg-cyan-500',
    category: 'core',
    fields: [
      { name: 'serviceType', label: 'Service Type', type: 'select', required: true,
        options: ['Auto Insurance', 'Home Insurance', 'Health Insurance', 'Life Insurance', 'Pet Insurance', 
                  'Electric Utility', 'Gas Utility', 'Water Utility', 'Internet', 'Mobile Phone', 
                  'Streaming', 'Security', 'Lawn Care', 'Cleaning', 'Other'] },
      { name: 'providerName', label: 'Provider Name', type: 'text', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text' },
      { name: 'monthlyCost', label: 'Monthly Cost', type: 'currency', required: true },
      { name: 'annualCost', label: 'Annual Cost', type: 'currency' },
      { name: 'contractStart', label: 'Contract Start Date', type: 'date' },
      { name: 'contractEnd', label: 'Contract End Date', type: 'date' },
      { name: 'autoRenew', label: 'Auto-Renews', type: 'checkbox' },
      { name: 'cancellationNotice', label: 'Cancellation Notice (Days)', type: 'number' },
      { name: 'coverage', label: 'Coverage/Plan Details', type: 'textarea' },
      { name: 'deductible', label: 'Deductible', type: 'currency' },
      { name: 'contactPhone', label: 'Provider Phone', type: 'text' },
      { name: 'contactEmail', label: 'Provider Email', type: 'text' },
      { name: 'website', label: 'Provider Website', type: 'text' },
      { name: 'satisfactionRating', label: 'Your Satisfaction (1-5)', type: 'number', placeholder: '1-5' },
      { name: 'lastReviewed', label: 'Last Comparison Date', type: 'date' },
      { name: 'potentialSavings', label: 'Potential Savings Identified', type: 'currency' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'reminderDays', label: 'Remind Before Renewal (Days)', type: 'number', placeholder: '30' },
    ],
  },
  miscellaneous: {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    description: 'Boats, collectibles, jewelry, and other valuable assets',
    icon: 'Star',
    color: 'bg-violet-500',
    category: 'assets',
    fields: [
      { name: 'itemName', label: 'Item Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Boat', 'Jewelry', 'Collectibles', 'Electronics', 'Art', 'Other'], required: true },
      { name: 'estimatedValue', label: 'Estimated Value', type: 'currency' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
    ],
  },
}

