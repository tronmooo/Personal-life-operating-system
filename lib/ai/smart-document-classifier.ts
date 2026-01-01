/**
 * Smart Document Classifier
 * AI-powered document type detection and routing
 */

import type { Domain } from '@/types/domains'

// ============================================
// DOCUMENT TYPES & CATEGORIES
// ============================================

export type ScanCategory = 
  // Financial
  | 'receipt'
  | 'invoice'
  | 'bill'
  | 'tax_document'
  | 'pay_stub'
  | 'bank_statement'
  | 'credit_card_statement'
  | 'utility_bill'
  | 'check'
  | 'money_order'
  | 'investment_statement'
  | 'loan_document'
  | 'mortgage_document'
  // Food & Nutrition
  | 'meal'
  | 'nutrition_label'
  | 'menu'
  | 'grocery_list'
  // Identity
  | 'id_card'
  | 'drivers_license'
  | 'passport'
  | 'visa'
  | 'birth_certificate'
  | 'social_security_card'
  | 'green_card'
  | 'work_permit'
  // Insurance
  | 'insurance_card'
  | 'insurance_policy'
  | 'insurance_claim'
  // Medical
  | 'medical_record'
  | 'prescription'
  | 'lab_results'
  | 'vaccination_record'
  | 'xray'
  | 'mri_scan'
  | 'medical_bill'
  | 'eob'
  // Vehicle
  | 'vehicle_registration'
  | 'vehicle_title'
  | 'vehicle_insurance'
  | 'smog_certificate'
  | 'car_loan'
  | 'parking_ticket'
  | 'traffic_ticket'
  // Pets
  | 'pet_record'
  | 'pet_vaccination'
  | 'pet_license'
  | 'pet_adoption'
  // Home & Property
  | 'property_deed'
  | 'lease_agreement'
  | 'mortgage_statement'
  | 'hoa_document'
  | 'home_inspection'
  | 'appraisal'
  | 'warranty'
  // Travel
  | 'boarding_pass'
  | 'hotel_confirmation'
  | 'ticket'
  | 'itinerary'
  | 'travel_insurance'
  | 'rental_car'
  | 'cruise_document'
  // Education
  | 'diploma'
  | 'transcript'
  | 'report_card'
  | 'student_id'
  | 'class_schedule'
  | 'syllabus'
  | 'assignment'
  | 'homework'
  | 'exam'
  | 'research_paper'
  | 'thesis'
  | 'scholarship'
  | 'financial_aid'
  | 'tuition_bill'
  // Work & Career
  | 'resume'
  | 'cover_letter'
  | 'job_offer'
  | 'employment_contract'
  | 'performance_review'
  | 'training_certificate'
  | 'business_card'
  | 'nda'
  | 'work_schedule'
  // Projects
  | 'project_plan'
  | 'project_proposal'
  | 'project_report'
  | 'meeting_notes'
  | 'whiteboard'
  | 'diagram'
  | 'flowchart'
  | 'wireframe'
  | 'mockup'
  | 'blueprint'
  // Legal
  | 'contract'
  | 'agreement'
  | 'power_of_attorney'
  | 'will'
  | 'trust_document'
  | 'court_document'
  | 'legal_notice'
  | 'notarized_document'
  | 'affidavit'
  | 'patent'
  | 'trademark'
  | 'copyright'
  // Certificates & Awards
  | 'certificate'
  | 'award'
  | 'license'
  | 'permit'
  | 'membership_card'
  // Personal
  | 'letter'
  | 'postcard'
  | 'greeting_card'
  | 'invitation'
  | 'photo'
  | 'family_tree'
  | 'journal_entry'
  | 'handwritten_note'
  // Kids & Family
  | 'kids_artwork'
  | 'school_permission_slip'
  | 'immunization_record'
  | 'report_card_k12'
  | 'babysitter_info'
  | 'childcare_receipt'
  // Shopping & Products
  | 'product_manual'
  | 'product_label'
  | 'barcode'
  | 'qr_code'
  | 'coupon'
  | 'gift_card'
  | 'loyalty_card'
  // Tech & Digital
  | 'screenshot'
  | 'error_message'
  | 'code_snippet'
  | 'serial_number'
  | 'wifi_password'
  | 'software_license'
  | 'api_key'
  // Hobbies & Collections
  | 'recipe'
  | 'pattern'
  | 'score_sheet'
  | 'collectible'
  | 'sports_card'
  | 'stamp'
  | 'comic'
  | 'event_program'
  // Miscellaneous
  | 'whiteboard_photo'
  | 'sign'
  | 'label'
  | 'handwriting'
  | 'foreign_document'
  | 'unknown'
  | 'general'

export interface ScanOption {
  id: ScanCategory
  label: string
  shortLabel: string
  icon: string
  color: string
  bgColor: string
  description: string
  targetDomain: Domain
  keywords: string[]
  extractionFields: string[]
  priority: number
}

// ============================================
// SCAN OPTIONS CONFIGURATION
// ============================================

export const SCAN_OPTIONS: ScanOption[] = [
  // Financial
  {
    id: 'receipt',
    label: 'Scan Receipt',
    shortLabel: 'Receipt',
    icon: '🧾',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Scan receipts for expense tracking',
    targetDomain: 'financial',
    keywords: ['receipt', 'total', 'subtotal', 'tax', 'payment', 'purchase', 'order'],
    extractionFields: ['merchant', 'total', 'date', 'items', 'category', 'payment_method'],
    priority: 1
  },
  {
    id: 'invoice',
    label: 'Scan Invoice',
    shortLabel: 'Invoice',
    icon: '📄',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Scan invoices for payment tracking',
    targetDomain: 'financial',
    keywords: ['invoice', 'bill to', 'due date', 'amount due', 'invoice number'],
    extractionFields: ['vendor', 'invoice_number', 'amount', 'due_date', 'line_items'],
    priority: 2
  },
  {
    id: 'bill',
    label: 'Scan Bill',
    shortLabel: 'Bill',
    icon: '💳',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Utility bills, phone bills, etc.',
    targetDomain: 'financial',
    keywords: ['statement', 'amount due', 'due date', 'account number', 'billing period'],
    extractionFields: ['provider', 'account', 'amount', 'due_date', 'period'],
    priority: 3
  },
  {
    id: 'utility_bill',
    label: 'Utility Bill',
    shortLabel: 'Utility',
    icon: '💡',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    description: 'Electric, gas, water bills',
    targetDomain: 'home',
    keywords: ['kwh', 'therms', 'gallons', 'electricity', 'gas', 'water', 'utility'],
    extractionFields: ['provider', 'usage', 'amount', 'billing_period', 'account'],
    priority: 4
  },

  // Nutrition
  {
    id: 'meal',
    label: 'Scan Meal',
    shortLabel: 'Meal',
    icon: '🍽️',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Scan food for calorie tracking',
    targetDomain: 'nutrition',
    keywords: ['food', 'meal', 'calories', 'nutrition', 'serving'],
    extractionFields: ['food_items', 'calories', 'protein', 'carbs', 'fats', 'meal_type'],
    priority: 1
  },

  // Identity Documents
  {
    id: 'id_card',
    label: 'ID Card',
    shortLabel: 'ID',
    icon: '🪪',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Scan any ID card',
    targetDomain: 'legal',
    keywords: ['identification', 'id', 'issued', 'expires', 'date of birth'],
    extractionFields: ['name', 'id_number', 'issue_date', 'expiry_date', 'address'],
    priority: 5
  },
  {
    id: 'drivers_license',
    label: "Driver's License",
    shortLabel: 'License',
    icon: '🚗',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: "Scan driver's license",
    targetDomain: 'vehicles',
    keywords: ['driver', 'license', 'class', 'restrictions', 'endorse'],
    extractionFields: ['name', 'license_number', 'class', 'expiry', 'address', 'dob'],
    priority: 6
  },
  {
    id: 'passport',
    label: 'Passport',
    shortLabel: 'Passport',
    icon: '🛂',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Scan passport',
    targetDomain: 'travel',
    keywords: ['passport', 'nationality', 'mrz', 'visa'],
    extractionFields: ['name', 'passport_number', 'nationality', 'expiry', 'dob'],
    priority: 7
  },

  // Insurance
  {
    id: 'insurance_card',
    label: 'Insurance Card',
    shortLabel: 'Insurance',
    icon: '🏥',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    description: 'Health/auto/home insurance',
    targetDomain: 'insurance',
    keywords: ['insurance', 'member', 'group', 'policy', 'coverage', 'copay', 'deductible'],
    extractionFields: ['provider', 'member_id', 'group_number', 'policy_number', 'coverage_type'],
    priority: 2
  },

  // Medical
  {
    id: 'medical_record',
    label: 'Medical Record',
    shortLabel: 'Medical',
    icon: '📋',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Lab results, medical reports',
    targetDomain: 'health',
    keywords: ['patient', 'diagnosis', 'lab', 'test results', 'blood', 'medical', 'report'],
    extractionFields: ['test_type', 'results', 'date', 'provider', 'notes'],
    priority: 8
  },
  {
    id: 'prescription',
    label: 'Prescription',
    shortLabel: 'Rx',
    icon: '💊',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    description: 'Medication prescriptions',
    targetDomain: 'health',
    keywords: ['rx', 'prescription', 'medication', 'dosage', 'refill', 'pharmacy'],
    extractionFields: ['medication', 'dosage', 'frequency', 'prescriber', 'pharmacy', 'refills'],
    priority: 9
  },

  // Vehicle Documents
  {
    id: 'vehicle_registration',
    label: 'Vehicle Registration',
    shortLabel: 'Registration',
    icon: '📜',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Car registration documents',
    targetDomain: 'vehicles',
    keywords: ['registration', 'vin', 'plate', 'vehicle', 'title', 'dmv'],
    extractionFields: ['make', 'model', 'year', 'vin', 'plate_number', 'expiry'],
    priority: 10
  },
  {
    id: 'vehicle_title',
    label: 'Vehicle Title',
    shortLabel: 'Title',
    icon: '📃',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    description: 'Car title/ownership',
    targetDomain: 'vehicles',
    keywords: ['title', 'certificate', 'ownership', 'vin', 'odometer'],
    extractionFields: ['make', 'model', 'year', 'vin', 'owner', 'title_number'],
    priority: 11
  },
  {
    id: 'vehicle_insurance',
    label: 'Auto Insurance',
    shortLabel: 'Auto Ins',
    icon: '🚙',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    description: 'Vehicle insurance card',
    targetDomain: 'vehicles',
    keywords: ['auto insurance', 'vehicle coverage', 'liability', 'comprehensive', 'collision'],
    extractionFields: ['provider', 'policy_number', 'vehicle', 'coverage', 'expiry'],
    priority: 12
  },

  // Financial Documents
  {
    id: 'pay_stub',
    label: 'Pay Stub',
    shortLabel: 'Pay Stub',
    icon: '💰',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Paycheck stubs',
    targetDomain: 'financial',
    keywords: ['earnings', 'pay period', 'gross pay', 'net pay', 'deductions', 'ytd'],
    extractionFields: ['employer', 'gross_pay', 'net_pay', 'deductions', 'pay_period', 'ytd'],
    priority: 13
  },
  {
    id: 'bank_statement',
    label: 'Bank Statement',
    shortLabel: 'Bank',
    icon: '🏦',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Bank account statements',
    targetDomain: 'financial',
    keywords: ['account', 'statement', 'balance', 'transactions', 'deposits', 'withdrawals'],
    extractionFields: ['bank', 'account', 'period', 'starting_balance', 'ending_balance', 'transactions'],
    priority: 14
  },
  {
    id: 'tax_document',
    label: 'Tax Document',
    shortLabel: 'Tax',
    icon: '📊',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'W2, 1099, tax forms',
    targetDomain: 'financial',
    keywords: ['w2', 'w-2', '1099', 'tax', 'wages', 'federal', 'irs', 'ein'],
    extractionFields: ['form_type', 'tax_year', 'wages', 'taxes_withheld', 'employer_ein'],
    priority: 15
  },

  // Home & Property
  {
    id: 'property_deed',
    label: 'Property Deed',
    shortLabel: 'Deed',
    icon: '🏠',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Property ownership documents',
    targetDomain: 'property',
    keywords: ['deed', 'grant', 'property', 'parcel', 'legal description', 'recorded'],
    extractionFields: ['address', 'parcel_number', 'owner', 'date', 'legal_description'],
    priority: 16
  },
  {
    id: 'lease_agreement',
    label: 'Lease Agreement',
    shortLabel: 'Lease',
    icon: '📝',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    description: 'Rental/lease contracts',
    targetDomain: 'home',
    keywords: ['lease', 'rental', 'tenant', 'landlord', 'rent', 'term'],
    extractionFields: ['property', 'landlord', 'tenant', 'rent', 'term', 'start_date'],
    priority: 17
  },
  {
    id: 'warranty',
    label: 'Warranty',
    shortLabel: 'Warranty',
    icon: '🛡️',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    description: 'Product warranties',
    targetDomain: 'appliances',
    keywords: ['warranty', 'guarantee', 'coverage', 'serial number', 'product'],
    extractionFields: ['product', 'serial_number', 'purchase_date', 'warranty_expiry', 'coverage'],
    priority: 18
  },

  // Pet
  {
    id: 'pet_record',
    label: 'Pet Record',
    shortLabel: 'Pet',
    icon: '🐾',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Vet records, vaccinations',
    targetDomain: 'pets',
    keywords: ['veterinary', 'vaccination', 'rabies', 'microchip', 'pet', 'animal'],
    extractionFields: ['pet_name', 'species', 'vaccination', 'date', 'vet', 'notes'],
    priority: 19
  },

  // Travel
  {
    id: 'boarding_pass',
    label: 'Boarding Pass',
    shortLabel: 'Flight',
    icon: '✈️',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    description: 'Flight boarding passes',
    targetDomain: 'travel',
    keywords: ['boarding', 'flight', 'gate', 'seat', 'departure', 'arrival', 'airline'],
    extractionFields: ['airline', 'flight', 'from', 'to', 'date', 'seat', 'gate'],
    priority: 20
  },
  {
    id: 'hotel_confirmation',
    label: 'Hotel Confirmation',
    shortLabel: 'Hotel',
    icon: '🏨',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    description: 'Hotel reservations',
    targetDomain: 'travel',
    keywords: ['hotel', 'reservation', 'check-in', 'check-out', 'confirmation', 'booking'],
    extractionFields: ['hotel', 'confirmation', 'check_in', 'check_out', 'room_type', 'total'],
    priority: 21
  },
  {
    id: 'ticket',
    label: 'Ticket',
    shortLabel: 'Ticket',
    icon: '🎟️',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/10',
    description: 'Event tickets, train tickets',
    targetDomain: 'travel',
    keywords: ['ticket', 'seat', 'event', 'admit', 'barcode', 'qr'],
    extractionFields: ['event', 'date', 'time', 'venue', 'seat', 'price'],
    priority: 22
  },

  // Other
  {
    id: 'business_card',
    label: 'Business Card',
    shortLabel: 'Contact',
    icon: '👤',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Scan business cards',
    targetDomain: 'relationships',
    keywords: ['business card', 'contact', 'email', 'phone', 'company'],
    extractionFields: ['name', 'title', 'company', 'email', 'phone', 'address'],
    priority: 23
  },
  {
    id: 'certificate',
    label: 'Certificate',
    shortLabel: 'Cert',
    icon: '🎓',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    description: 'Certificates, diplomas',
    targetDomain: 'education',
    keywords: ['certificate', 'diploma', 'degree', 'awarded', 'completion', 'graduate'],
    extractionFields: ['title', 'recipient', 'issuer', 'date', 'field'],
    priority: 24
  },
  {
    id: 'contract',
    label: 'Contract',
    shortLabel: 'Contract',
    icon: '📑',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    description: 'Legal contracts',
    targetDomain: 'legal',
    keywords: ['agreement', 'contract', 'terms', 'parties', 'effective date', 'signature'],
    extractionFields: ['type', 'parties', 'effective_date', 'terms', 'value'],
    priority: 25
  },

  // ========== EDUCATION ==========
  {
    id: 'diploma',
    label: 'Diploma/Degree',
    shortLabel: 'Diploma',
    icon: '🎓',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    description: 'College diploma or degree',
    targetDomain: 'education',
    keywords: ['diploma', 'degree', 'bachelor', 'master', 'phd', 'graduate', 'conferred'],
    extractionFields: ['institution', 'degree', 'major', 'date', 'recipient'],
    priority: 30
  },
  {
    id: 'transcript',
    label: 'Transcript',
    shortLabel: 'Transcript',
    icon: '📜',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Academic transcript',
    targetDomain: 'education',
    keywords: ['transcript', 'gpa', 'credits', 'courses', 'grades', 'semester'],
    extractionFields: ['institution', 'gpa', 'credits', 'courses', 'date'],
    priority: 31
  },
  {
    id: 'report_card',
    label: 'Report Card',
    shortLabel: 'Grades',
    icon: '📝',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'School report card',
    targetDomain: 'education',
    keywords: ['report card', 'grades', 'student', 'teacher', 'semester', 'quarter'],
    extractionFields: ['school', 'student', 'grades', 'period', 'teacher_comments'],
    priority: 32
  },
  {
    id: 'assignment',
    label: 'Assignment/Homework',
    shortLabel: 'Assignment',
    icon: '📋',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'School assignment or homework',
    targetDomain: 'education',
    keywords: ['assignment', 'homework', 'due date', 'instructions', 'submit'],
    extractionFields: ['course', 'title', 'due_date', 'instructions', 'points'],
    priority: 33
  },
  {
    id: 'syllabus',
    label: 'Syllabus',
    shortLabel: 'Syllabus',
    icon: '📚',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Course syllabus',
    targetDomain: 'education',
    keywords: ['syllabus', 'course', 'instructor', 'textbook', 'schedule', 'objectives'],
    extractionFields: ['course', 'instructor', 'schedule', 'textbooks', 'grading'],
    priority: 34
  },
  {
    id: 'exam',
    label: 'Exam/Test',
    shortLabel: 'Exam',
    icon: '✏️',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Exam or test paper',
    targetDomain: 'education',
    keywords: ['exam', 'test', 'quiz', 'final', 'midterm', 'score'],
    extractionFields: ['course', 'type', 'score', 'date', 'questions'],
    priority: 35
  },
  {
    id: 'research_paper',
    label: 'Research Paper',
    shortLabel: 'Research',
    icon: '🔬',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    description: 'Research paper or thesis',
    targetDomain: 'education',
    keywords: ['research', 'paper', 'thesis', 'abstract', 'bibliography', 'references'],
    extractionFields: ['title', 'author', 'abstract', 'keywords', 'date'],
    priority: 36
  },
  {
    id: 'scholarship',
    label: 'Scholarship',
    shortLabel: 'Scholarship',
    icon: '🏆',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Scholarship award or application',
    targetDomain: 'education',
    keywords: ['scholarship', 'award', 'merit', 'grant', 'financial aid'],
    extractionFields: ['name', 'amount', 'recipient', 'criteria', 'deadline'],
    priority: 37
  },
  {
    id: 'tuition_bill',
    label: 'Tuition Bill',
    shortLabel: 'Tuition',
    icon: '🎒',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    description: 'Tuition or school fees',
    targetDomain: 'education',
    keywords: ['tuition', 'fees', 'enrollment', 'semester', 'balance'],
    extractionFields: ['institution', 'amount', 'due_date', 'semester', 'student_id'],
    priority: 38
  },

  // ========== WORK & CAREER ==========
  {
    id: 'resume',
    label: 'Resume/CV',
    shortLabel: 'Resume',
    icon: '📄',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Resume or curriculum vitae',
    targetDomain: 'career',
    keywords: ['resume', 'cv', 'experience', 'skills', 'education', 'objective'],
    extractionFields: ['name', 'contact', 'experience', 'education', 'skills'],
    priority: 40
  },
  {
    id: 'job_offer',
    label: 'Job Offer',
    shortLabel: 'Job Offer',
    icon: '🤝',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Job offer letter',
    targetDomain: 'career',
    keywords: ['offer', 'position', 'salary', 'start date', 'benefits', 'employment'],
    extractionFields: ['company', 'position', 'salary', 'start_date', 'benefits'],
    priority: 41
  },
  {
    id: 'employment_contract',
    label: 'Employment Contract',
    shortLabel: 'Contract',
    icon: '📑',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Employment agreement',
    targetDomain: 'career',
    keywords: ['employment', 'contract', 'agreement', 'terms', 'termination'],
    extractionFields: ['employer', 'employee', 'position', 'salary', 'terms'],
    priority: 42
  },
  {
    id: 'performance_review',
    label: 'Performance Review',
    shortLabel: 'Review',
    icon: '⭐',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    description: 'Employee performance review',
    targetDomain: 'career',
    keywords: ['performance', 'review', 'evaluation', 'goals', 'feedback', 'rating'],
    extractionFields: ['employee', 'period', 'rating', 'goals', 'feedback'],
    priority: 43
  },
  {
    id: 'nda',
    label: 'NDA',
    shortLabel: 'NDA',
    icon: '🔒',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Non-disclosure agreement',
    targetDomain: 'career',
    keywords: ['nda', 'non-disclosure', 'confidential', 'agreement', 'proprietary'],
    extractionFields: ['parties', 'effective_date', 'term', 'scope'],
    priority: 44
  },

  // ========== PROJECTS ==========
  {
    id: 'project_plan',
    label: 'Project Plan',
    shortLabel: 'Plan',
    icon: '📊',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Project plan or timeline',
    targetDomain: 'career',
    keywords: ['project', 'plan', 'timeline', 'milestone', 'deliverable', 'gantt'],
    extractionFields: ['project_name', 'milestones', 'timeline', 'team', 'budget'],
    priority: 50
  },
  {
    id: 'meeting_notes',
    label: 'Meeting Notes',
    shortLabel: 'Notes',
    icon: '📝',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    description: 'Meeting notes or minutes',
    targetDomain: 'career',
    keywords: ['meeting', 'notes', 'minutes', 'agenda', 'action items', 'attendees'],
    extractionFields: ['date', 'attendees', 'topics', 'action_items', 'decisions'],
    priority: 51
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    shortLabel: 'Whiteboard',
    icon: '🖼️',
    color: 'text-white',
    bgColor: 'bg-gray-500/10',
    description: 'Whiteboard photo',
    targetDomain: 'career',
    keywords: ['whiteboard', 'diagram', 'brainstorm', 'sketch'],
    extractionFields: ['content', 'date', 'context'],
    priority: 52
  },
  {
    id: 'diagram',
    label: 'Diagram/Chart',
    shortLabel: 'Diagram',
    icon: '📈',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Diagram, chart, or graph',
    targetDomain: 'career',
    keywords: ['diagram', 'chart', 'graph', 'flowchart', 'architecture'],
    extractionFields: ['type', 'title', 'content', 'context'],
    priority: 53
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    shortLabel: 'Blueprint',
    icon: '🏗️',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Architectural blueprint or floor plan',
    targetDomain: 'home',
    keywords: ['blueprint', 'floor plan', 'architecture', 'dimensions', 'layout'],
    extractionFields: ['project', 'dimensions', 'scale', 'rooms'],
    priority: 54
  },

  // ========== LEGAL ==========
  {
    id: 'power_of_attorney',
    label: 'Power of Attorney',
    shortLabel: 'POA',
    icon: '⚖️',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Power of attorney document',
    targetDomain: 'legal',
    keywords: ['power of attorney', 'poa', 'agent', 'principal', 'authority'],
    extractionFields: ['principal', 'agent', 'powers', 'effective_date'],
    priority: 60
  },
  {
    id: 'will',
    label: 'Will/Testament',
    shortLabel: 'Will',
    icon: '📜',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Last will and testament',
    targetDomain: 'legal',
    keywords: ['will', 'testament', 'estate', 'beneficiary', 'executor'],
    extractionFields: ['testator', 'beneficiaries', 'executor', 'date'],
    priority: 61
  },
  {
    id: 'court_document',
    label: 'Court Document',
    shortLabel: 'Court',
    icon: '🏛️',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    description: 'Court filing or order',
    targetDomain: 'legal',
    keywords: ['court', 'case', 'plaintiff', 'defendant', 'order', 'judgment'],
    extractionFields: ['case_number', 'parties', 'court', 'date', 'type'],
    priority: 62
  },
  {
    id: 'birth_certificate',
    label: 'Birth Certificate',
    shortLabel: 'Birth Cert',
    icon: '👶',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    description: 'Birth certificate',
    targetDomain: 'legal',
    keywords: ['birth', 'certificate', 'born', 'parents', 'registrar'],
    extractionFields: ['name', 'date_of_birth', 'place', 'parents', 'certificate_number'],
    priority: 63
  },
  {
    id: 'social_security_card',
    label: 'Social Security Card',
    shortLabel: 'SSN',
    icon: '🔐',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Social security card',
    targetDomain: 'legal',
    keywords: ['social security', 'ssn', 'ssa'],
    extractionFields: ['name', 'number'],
    priority: 64
  },

  // ========== PERSONAL & FAMILY ==========
  {
    id: 'photo',
    label: 'Photo',
    shortLabel: 'Photo',
    icon: '📸',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    description: 'Personal photo',
    targetDomain: 'relationships',
    keywords: ['photo', 'picture', 'image'],
    extractionFields: ['people', 'location', 'date', 'description'],
    priority: 70
  },
  {
    id: 'kids_artwork',
    label: 'Kids Artwork',
    shortLabel: 'Artwork',
    icon: '🎨',
    color: 'text-rainbow-400',
    bgColor: 'bg-pink-500/10',
    description: 'Children\'s artwork or drawings',
    targetDomain: 'relationships',
    keywords: ['drawing', 'artwork', 'craft', 'painting'],
    extractionFields: ['child', 'title', 'date', 'description'],
    priority: 71
  },
  {
    id: 'invitation',
    label: 'Invitation',
    shortLabel: 'Invite',
    icon: '💌',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    description: 'Event invitation',
    targetDomain: 'relationships',
    keywords: ['invitation', 'invite', 'rsvp', 'celebrate', 'party'],
    extractionFields: ['event', 'date', 'time', 'location', 'host'],
    priority: 72
  },
  {
    id: 'recipe',
    label: 'Recipe',
    shortLabel: 'Recipe',
    icon: '🍳',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Cooking recipe',
    targetDomain: 'nutrition',
    keywords: ['recipe', 'ingredients', 'instructions', 'cook', 'bake', 'servings'],
    extractionFields: ['name', 'ingredients', 'instructions', 'servings', 'time'],
    priority: 73
  },
  {
    id: 'handwritten_note',
    label: 'Handwritten Note',
    shortLabel: 'Note',
    icon: '✍️',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Handwritten note or letter',
    targetDomain: 'mindfulness',
    keywords: ['note', 'handwritten', 'letter', 'memo'],
    extractionFields: ['content', 'author', 'date'],
    priority: 74
  },

  // ========== TECH & DIGITAL ==========
  {
    id: 'screenshot',
    label: 'Screenshot',
    shortLabel: 'Screenshot',
    icon: '🖥️',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Screen capture',
    targetDomain: 'digital-life',
    keywords: ['screenshot', 'screen', 'capture'],
    extractionFields: ['app', 'content', 'date'],
    priority: 80
  },
  {
    id: 'software_license',
    label: 'Software License',
    shortLabel: 'License',
    icon: '💿',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    description: 'Software license key',
    targetDomain: 'digital-life',
    keywords: ['license', 'key', 'serial', 'activation', 'product key'],
    extractionFields: ['software', 'license_key', 'expiry', 'email'],
    priority: 81
  },
  {
    id: 'wifi_password',
    label: 'WiFi Password',
    shortLabel: 'WiFi',
    icon: '📶',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'WiFi network credentials',
    targetDomain: 'digital-life',
    keywords: ['wifi', 'password', 'network', 'ssid', 'wireless'],
    extractionFields: ['network_name', 'password', 'security_type'],
    priority: 82
  },
  {
    id: 'serial_number',
    label: 'Serial Number',
    shortLabel: 'Serial',
    icon: '🔢',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    description: 'Product serial number',
    targetDomain: 'appliances',
    keywords: ['serial', 'number', 'model', 'product'],
    extractionFields: ['product', 'serial_number', 'model', 'manufacturer'],
    priority: 83
  },

  // ========== SHOPPING ==========
  {
    id: 'coupon',
    label: 'Coupon',
    shortLabel: 'Coupon',
    icon: '🎫',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Coupon or discount code',
    targetDomain: 'financial',
    keywords: ['coupon', 'discount', 'promo', 'code', 'off', 'save'],
    extractionFields: ['store', 'discount', 'code', 'expiry', 'terms'],
    priority: 90
  },
  {
    id: 'gift_card',
    label: 'Gift Card',
    shortLabel: 'Gift Card',
    icon: '🎁',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    description: 'Gift card or voucher',
    targetDomain: 'financial',
    keywords: ['gift card', 'voucher', 'balance', 'redeem'],
    extractionFields: ['store', 'balance', 'card_number', 'pin'],
    priority: 91
  },
  {
    id: 'product_manual',
    label: 'Product Manual',
    shortLabel: 'Manual',
    icon: '📖',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Product user manual',
    targetDomain: 'appliances',
    keywords: ['manual', 'instructions', 'user guide', 'setup'],
    extractionFields: ['product', 'model', 'manufacturer'],
    priority: 92
  },
  {
    id: 'barcode',
    label: 'Barcode',
    shortLabel: 'Barcode',
    icon: '📊',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Product barcode',
    targetDomain: 'appliances',
    keywords: ['barcode', 'upc', 'ean', 'sku'],
    extractionFields: ['code', 'product'],
    priority: 93
  },
  {
    id: 'qr_code',
    label: 'QR Code',
    shortLabel: 'QR',
    icon: '📱',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'QR code',
    targetDomain: 'digital-life',
    keywords: ['qr', 'code', 'scan'],
    extractionFields: ['content', 'type'],
    priority: 94
  },

  // ========== ADDITIONAL MEDICAL ==========
  {
    id: 'lab_results',
    label: 'Lab Results',
    shortLabel: 'Lab',
    icon: '🧪',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Laboratory test results',
    targetDomain: 'health',
    keywords: ['lab', 'results', 'blood', 'urine', 'cholesterol', 'glucose'],
    extractionFields: ['tests', 'results', 'reference_range', 'date', 'provider'],
    priority: 95
  },
  {
    id: 'vaccination_record',
    label: 'Vaccination Record',
    shortLabel: 'Vaccine',
    icon: '💉',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Immunization record',
    targetDomain: 'health',
    keywords: ['vaccine', 'immunization', 'shot', 'booster', 'covid'],
    extractionFields: ['vaccine', 'date', 'lot_number', 'provider', 'next_dose'],
    priority: 96
  },
  {
    id: 'xray',
    label: 'X-Ray/Imaging',
    shortLabel: 'X-Ray',
    icon: '🩻',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'X-ray or medical imaging',
    targetDomain: 'health',
    keywords: ['xray', 'x-ray', 'mri', 'ct', 'scan', 'imaging', 'radiology'],
    extractionFields: ['type', 'body_part', 'date', 'findings', 'provider'],
    priority: 97
  },
  {
    id: 'eob',
    label: 'Insurance EOB',
    shortLabel: 'EOB',
    icon: '📋',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    description: 'Explanation of benefits',
    targetDomain: 'insurance',
    keywords: ['eob', 'explanation', 'benefits', 'claim', 'allowed', 'paid'],
    extractionFields: ['provider', 'service_date', 'billed', 'allowed', 'paid', 'patient_owes'],
    priority: 98
  },

  // ========== CATCH-ALL ==========
  {
    id: 'unknown',
    label: 'Unknown Document',
    shortLabel: 'Unknown',
    icon: '❓',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Unidentified document',
    targetDomain: 'mindfulness',
    keywords: [],
    extractionFields: ['content'],
    priority: 99
  },
  {
    id: 'general',
    label: 'Any Document',
    shortLabel: 'Other',
    icon: '📷',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Let AI detect document type',
    targetDomain: 'mindfulness',
    keywords: [],
    extractionFields: [],
    priority: 100
  }
]

// ============================================
// GROUPED CATEGORIES
// ============================================

export interface ScanCategoryGroup {
  id: string
  label: string
  icon: string
  color: string
  options: ScanCategory[]
}

export const SCAN_CATEGORY_GROUPS: ScanCategoryGroup[] = [
  {
    id: 'financial',
    label: 'Financial',
    icon: '💰',
    color: 'from-green-400 to-emerald-500',
    options: ['receipt', 'invoice', 'bill', 'pay_stub', 'bank_statement', 'tax_document', 'check', 'investment_statement', 'loan_document', 'mortgage_document']
  },
  {
    id: 'food',
    label: 'Food & Nutrition',
    icon: '🍽️',
    color: 'from-orange-400 to-red-500',
    options: ['meal', 'recipe', 'nutrition_label']
  },
  {
    id: 'identity',
    label: 'Identity',
    icon: '🪪',
    color: 'from-blue-400 to-indigo-500',
    options: ['id_card', 'drivers_license', 'passport', 'birth_certificate', 'social_security_card']
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: '🛡️',
    color: 'from-emerald-400 to-teal-500',
    options: ['insurance_card', 'insurance_policy', 'insurance_claim', 'vehicle_insurance', 'eob']
  },
  {
    id: 'medical',
    label: 'Medical & Health',
    icon: '⚕️',
    color: 'from-red-400 to-pink-500',
    options: ['medical_record', 'prescription', 'lab_results', 'vaccination_record', 'xray', 'medical_bill']
  },
  {
    id: 'vehicle',
    label: 'Vehicle',
    icon: '🚗',
    color: 'from-amber-400 to-orange-500',
    options: ['vehicle_registration', 'vehicle_title', 'vehicle_insurance', 'smog_certificate', 'car_loan', 'parking_ticket']
  },
  {
    id: 'home',
    label: 'Home & Property',
    icon: '🏠',
    color: 'from-violet-400 to-purple-500',
    options: ['utility_bill', 'property_deed', 'lease_agreement', 'warranty', 'mortgage_statement', 'home_inspection', 'blueprint']
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: '✈️',
    color: 'from-sky-400 to-blue-500',
    options: ['boarding_pass', 'hotel_confirmation', 'ticket', 'itinerary', 'travel_insurance', 'rental_car']
  },
  {
    id: 'education',
    label: 'Education & School',
    icon: '🎓',
    color: 'from-yellow-400 to-amber-500',
    options: ['diploma', 'transcript', 'report_card', 'assignment', 'syllabus', 'exam', 'research_paper', 'scholarship', 'tuition_bill']
  },
  {
    id: 'work',
    label: 'Work & Career',
    icon: '💼',
    color: 'from-indigo-400 to-purple-500',
    options: ['resume', 'job_offer', 'employment_contract', 'performance_review', 'nda', 'business_card']
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: '📊',
    color: 'from-cyan-400 to-blue-500',
    options: ['project_plan', 'meeting_notes', 'whiteboard', 'diagram']
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖️',
    color: 'from-gray-400 to-slate-500',
    options: ['contract', 'power_of_attorney', 'will', 'court_document', 'birth_certificate']
  },
  {
    id: 'pets',
    label: 'Pets',
    icon: '🐾',
    color: 'from-amber-400 to-yellow-500',
    options: ['pet_record', 'pet_vaccination', 'pet_license']
  },
  {
    id: 'personal',
    label: 'Personal & Family',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-pink-400 to-rose-500',
    options: ['photo', 'kids_artwork', 'invitation', 'handwritten_note']
  },
  {
    id: 'tech',
    label: 'Tech & Digital',
    icon: '💻',
    color: 'from-slate-400 to-gray-500',
    options: ['screenshot', 'software_license', 'wifi_password', 'serial_number', 'qr_code', 'barcode']
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛒',
    color: 'from-rose-400 to-red-500',
    options: ['coupon', 'gift_card', 'product_manual']
  },
  {
    id: 'other',
    label: 'Other',
    icon: '📄',
    color: 'from-gray-400 to-gray-500',
    options: ['unknown', 'general']
  }
]

// ============================================
// QUICK SCAN OPTIONS (Most Used)
// ============================================

export const QUICK_SCAN_OPTIONS: ScanCategory[] = [
  'receipt',
  'meal',
  'id_card',
  'insurance_card',
  'assignment',
  'general'
]

// ============================================
// CLASSIFICATION FUNCTIONS
// ============================================

/**
 * Get scan option by ID
 */
export function getScanOption(id: ScanCategory): ScanOption | undefined {
  return SCAN_OPTIONS.find(opt => opt.id === id)
}

/**
 * Get options for a category group
 */
export function getGroupOptions(groupId: string): ScanOption[] {
  const group = SCAN_CATEGORY_GROUPS.find(g => g.id === groupId)
  if (!group) return []
  return group.options.map(id => getScanOption(id)).filter(Boolean) as ScanOption[]
}

/**
 * Build AI prompt for document classification
 */
export function buildClassificationPrompt(extractedText: string): string {
  const documentTypes = SCAN_OPTIONS.map(opt => ({
    type: opt.id,
    keywords: opt.keywords,
    fields: opt.extractionFields
  }))

  return `You are a document classification expert. Analyze the following text extracted from a scanned document and determine:

1. The document type (choose from the list below)
2. Confidence level (0-100)
3. Extract relevant data fields based on document type
4. Provide reasoning for your classification

DOCUMENT TYPES:
${documentTypes.map(dt => `- ${dt.type}: keywords=[${dt.keywords.join(', ')}], extract=[${dt.fields.join(', ')}]`).join('\n')}

EXTRACTED TEXT:
"""
${extractedText}
"""

Respond with JSON:
{
  "documentType": "type_id",
  "confidence": 85,
  "reasoning": "Why this classification",
  "extractedData": {
    // field: value pairs based on document type
  },
  "suggestedDomain": "domain_name",
  "suggestedAction": "what to do with this data"
}

Only return valid JSON, no other text.`
}

/**
 * Classify document based on keywords (fallback without AI)
 */
export function classifyByKeywords(text: string): { 
  type: ScanCategory
  confidence: number
  option: ScanOption 
} {
  const lowerText = text.toLowerCase()
  
  let bestMatch: { type: ScanCategory; score: number; option: ScanOption } = {
    type: 'general',
    score: 0,
    option: SCAN_OPTIONS.find(o => o.id === 'general')!
  }

  for (const option of SCAN_OPTIONS) {
    if (option.id === 'general') continue
    
    let score = 0
    for (const keyword of option.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 10
      }
    }
    
    // Boost based on priority (lower priority = higher boost)
    score += (30 - option.priority)
    
    if (score > bestMatch.score) {
      bestMatch = { type: option.id, score, option }
    }
  }

  // Calculate confidence (max 95 for keyword-based)
  const confidence = Math.min(95, Math.round((bestMatch.score / 50) * 100))

  return {
    type: bestMatch.type,
    confidence,
    option: bestMatch.option
  }
}

/**
 * Get domain routing for a scan category
 */
export function getDomainForCategory(category: ScanCategory): Domain {
  const option = getScanOption(category)
  return option?.targetDomain || 'mindfulness'
}

/**
 * Get extraction fields for a category
 */
export function getExtractionFields(category: ScanCategory): string[] {
  const option = getScanOption(category)
  return option?.extractionFields || []
}

// ============================================
// SMART SCAN RESULT TYPE
// ============================================

export interface SmartScanResult {
  // Classification
  documentType: ScanCategory
  confidence: number
  reasoning: string
  
  // Extracted data
  extractedData: Record<string, any>
  rawText: string
  
  // Routing
  suggestedDomain: Domain
  suggestedAction: string
  option: ScanOption
  
  // Image
  imageUrl?: string
  thumbnailUrl?: string
}

/**
 * Create a default scan result for a category
 */
export function createScanResultForCategory(
  category: ScanCategory,
  extractedText: string,
  imageUrl?: string
): Partial<SmartScanResult> {
  const option = getScanOption(category) || SCAN_OPTIONS.find(o => o.id === 'general')!
  
  return {
    documentType: category,
    confidence: 100,  // User explicitly selected
    reasoning: `User selected: ${option.label}`,
    rawText: extractedText,
    suggestedDomain: option.targetDomain,
    suggestedAction: `Save to ${option.targetDomain}`,
    option,
    imageUrl
  }
}

