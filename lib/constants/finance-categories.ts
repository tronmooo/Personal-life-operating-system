import { Category } from '@/types/finance'

// Predefined default categories with icons and colors
export const DEFAULT_CATEGORIES: Category[] = [
  // ============ INCOME CATEGORIES ============
  {
    id: 'income-salary',
    name: 'Salary',
    icon: '💰',
    color: '#10b981',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-freelance',
    name: 'Freelance',
    icon: '💼',
    color: '#3b82f6',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-bonus',
    name: 'Bonus',
    icon: '🎁',
    color: '#8b5cf6',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-investment',
    name: 'Investment Income',
    icon: '📈',
    color: '#06b6d4',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-rental',
    name: 'Rental Income',
    icon: '🏘️',
    color: '#f59e0b',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-refund',
    name: 'Refund',
    icon: '↩️',
    color: '#84cc16',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-gift',
    name: 'Gift Received',
    icon: '🎉',
    color: '#ec4899',
    type: 'income',
    isDefault: true,
  },
  {
    id: 'income-other',
    name: 'Other Income',
    icon: '💵',
    color: '#14b8a6',
    type: 'income',
    isDefault: true,
  },

  // ============ ESSENTIAL EXPENSE CATEGORIES ============
  {
    id: 'exp-housing',
    name: 'Housing',
    icon: '🏠',
    color: '#3b82f6',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-groceries',
    name: 'Groceries',
    icon: '🛒',
    color: '#10b981',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-utilities',
    name: 'Utilities',
    icon: '💡',
    color: '#f59e0b',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-transport',
    name: 'Transportation',
    icon: '🚗',
    color: '#ef4444',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-gas',
    name: 'Gas & Fuel',
    icon: '⛽',
    color: '#f97316',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-insurance',
    name: 'Insurance',
    icon: '🛡️',
    color: '#8b5cf6',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-healthcare',
    name: 'Healthcare',
    icon: '🏥',
    color: '#ef4444',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-phone',
    name: 'Phone & Internet',
    icon: '📱',
    color: '#06b6d4',
    type: 'expense',
    isDefault: true,
  },

  // ============ LIFESTYLE EXPENSE CATEGORIES ============
  {
    id: 'exp-dining',
    name: 'Dining Out',
    icon: '🍽️',
    color: '#f97316',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-entertainment',
    name: 'Entertainment',
    icon: '🎮',
    color: '#8b5cf6',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#ec4899',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-subscriptions',
    name: 'Subscriptions',
    icon: '📺',
    color: '#6366f1',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-travel',
    name: 'Travel',
    icon: '✈️',
    color: '#06b6d4',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-hobbies',
    name: 'Hobbies',
    icon: '🎨',
    color: '#a855f7',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-fitness',
    name: 'Fitness & Gym',
    icon: '💪',
    color: '#10b981',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-beauty',
    name: 'Beauty & Personal Care',
    icon: '💅',
    color: '#f472b6',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-pets',
    name: 'Pets',
    icon: '🐾',
    color: '#fb923c',
    type: 'expense',
    isDefault: true,
  },

  // ============ SAVINGS & FINANCIAL CATEGORIES ============
  {
    id: 'exp-savings',
    name: 'Savings',
    icon: '🏦',
    color: '#10b981',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-investment',
    name: 'Investments',
    icon: '📊',
    color: '#3b82f6',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-debt',
    name: 'Debt Payment',
    icon: '💳',
    color: '#ef4444',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-loan',
    name: 'Loan Payment',
    icon: '🏦',
    color: '#f59e0b',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-charity',
    name: 'Charity & Donations',
    icon: '❤️',
    color: '#ec4899',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-gifts',
    name: 'Gifts',
    icon: '🎁',
    color: '#a855f7',
    type: 'expense',
    isDefault: true,
  },

  // ============ OTHER CATEGORIES ============
  {
    id: 'exp-education',
    name: 'Education',
    icon: '📚',
    color: '#3b82f6',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-childcare',
    name: 'Childcare',
    icon: '👶',
    color: '#fb923c',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-legal',
    name: 'Legal & Professional',
    icon: '⚖️',
    color: '#64748b',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-home-improvement',
    name: 'Home Improvement',
    icon: '🔨',
    color: '#f97316',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-taxes',
    name: 'Taxes',
    icon: '📋',
    color: '#dc2626',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-fees',
    name: 'Fees & Charges',
    icon: '💸',
    color: '#ef4444',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'exp-other',
    name: 'Other Expense',
    icon: '📦',
    color: '#64748b',
    type: 'expense',
    isDefault: true,
  },
]

// Helper functions
export const getCategoryById = (id: string): Category | undefined => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id)
}

export const getCategoriesByType = (type: 'income' | 'expense'): Category[] => {
  return DEFAULT_CATEGORIES.filter(cat => cat.type === type)
}

export const getExpenseCategoriesByGroup = () => {
  return {
    essential: DEFAULT_CATEGORIES.filter(cat => 
      cat.type === 'expense' && 
      ['exp-housing', 'exp-groceries', 'exp-utilities', 'exp-transport', 'exp-gas', 'exp-insurance', 'exp-healthcare', 'exp-phone'].includes(cat.id)
    ),
    lifestyle: DEFAULT_CATEGORIES.filter(cat => 
      cat.type === 'expense' && 
      ['exp-dining', 'exp-entertainment', 'exp-shopping', 'exp-subscriptions', 'exp-travel', 'exp-hobbies', 'exp-fitness', 'exp-beauty', 'exp-pets'].includes(cat.id)
    ),
    savings: DEFAULT_CATEGORIES.filter(cat => 
      cat.type === 'expense' && 
      ['exp-savings', 'exp-investment', 'exp-debt', 'exp-loan', 'exp-charity', 'exp-gifts'].includes(cat.id)
    ),
    other: DEFAULT_CATEGORIES.filter(cat => 
      cat.type === 'expense' && 
      ['exp-education', 'exp-childcare', 'exp-legal', 'exp-home-improvement', 'exp-taxes', 'exp-fees', 'exp-other'].includes(cat.id)
    ),
  }
}

export const CATEGORY_GROUPS = {
  essential: {
    name: 'Essential',
    color: '#3b82f6',
    description: 'Necessary expenses for daily living',
  },
  lifestyle: {
    name: 'Lifestyle',
    color: '#8b5cf6',
    description: 'Discretionary spending and entertainment',
  },
  savings: {
    name: 'Savings & Goals',
    color: '#10b981',
    description: 'Savings, investments, and debt payments',
  },
  other: {
    name: 'Other',
    color: '#64748b',
    description: 'Miscellaneous and irregular expenses',
  },
}



















