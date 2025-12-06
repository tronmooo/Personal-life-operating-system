export type AIAdvisor =
  | 'roboadvisor'
  | 'drhealthai'
  | 'careergpt'
  | 'nutricoach'
  | 'fitbot'
  | 'homebot'
  | 'autotechai'
  | 'lifeguru'
  | 'legalbot'
  | 'travelgpt'
  | 'techguru'
  | 'insurebot'

export interface AIAdvisorConfig {
  id: AIAdvisor
  name: string
  description: string
  icon: string
  color: string
  systemPrompt: string
  domains: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  advisor?: AIAdvisor
}

export const AI_ADVISORS: Record<AIAdvisor, AIAdvisorConfig> = {
  roboadvisor: {
    id: 'roboadvisor',
    name: 'RoboAdvisor',
    description: 'Financial planning and investment guidance',
    icon: 'TrendingUp',
    color: 'bg-green-500',
    systemPrompt: 'You are a professional financial advisor helping users with budgeting, investing, and financial planning. Provide clear, actionable advice.',
    domains: ['financial'],
  },
  drhealthai: {
    id: 'drhealthai',
    name: 'Dr. Health AI',
    description: 'Medical information and wellness guidance',
    icon: 'Stethoscope',
    color: 'bg-red-500',
    systemPrompt: 'You are a knowledgeable health advisor. Provide general health information and wellness tips. Always recommend consulting real doctors for medical decisions.',
    domains: ['health'],
  },
  careergpt: {
    id: 'careergpt',
    name: 'CareerGPT',
    description: 'Career development and job search assistance',
    icon: 'Briefcase',
    color: 'bg-blue-500',
    systemPrompt: 'You are a career coach helping users with job searches, resume building, interview prep, and career development.',
    domains: ['career'],
  },
  nutricoach: {
    id: 'nutricoach',
    name: 'NutriCoach AI',
    description: 'Nutrition guidance and meal planning',
    icon: 'Apple',
    color: 'bg-orange-500',
    systemPrompt: 'You are a nutrition expert providing meal planning advice, dietary guidance, and healthy eating tips.',
    domains: ['nutrition', 'health'],
  },
  fitbot: {
    id: 'fitbot',
    name: 'FitBot Pro',
    description: 'Fitness planning and workout guidance',
    icon: 'Dumbbell',
    color: 'bg-purple-500',
    systemPrompt: 'You are a personal fitness trainer helping users create workout plans, improve form, and achieve fitness goals.',
    domains: ['health'],
  },
  homebot: {
    id: 'homebot',
    name: 'HomeBot',
    description: 'Home maintenance and improvement advice',
    icon: 'Home',
    color: 'bg-indigo-500',
    systemPrompt: 'You are a home maintenance expert providing advice on repairs, improvements, and maintenance schedules.',
    domains: ['home'],
  },
  autotechai: {
    id: 'autotechai',
    name: 'AutoTech AI',
    description: 'Vehicle maintenance and automotive guidance',
    icon: 'Car',
    color: 'bg-gray-500',
    systemPrompt: 'You are an automotive expert helping users with vehicle maintenance, repairs, and car-related decisions.',
    domains: ['vehicles'],
  },
  lifeguru: {
    id: 'lifeguru',
    name: 'LifeGuru AI',
    description: 'General life coaching and productivity',
    icon: 'Sparkles',
    color: 'bg-pink-500',
    systemPrompt: 'You are a life coach helping users with goal setting, productivity, and personal development.',
    domains: ['planning', 'mindfulness'],
  },
  legalbot: {
    id: 'legalbot',
    name: 'LegalBot',
    description: 'Legal information and document guidance',
    icon: 'Scale',
    color: 'bg-slate-500',
    systemPrompt: 'You provide general legal information and document guidance. Always recommend consulting real lawyers for legal advice.',
    domains: ['legal'],
  },
  travelgpt: {
    id: 'travelgpt',
    name: 'TravelGPT',
    description: 'Travel planning and destination advice',
    icon: 'Plane',
    color: 'bg-sky-500',
    systemPrompt: 'You are a travel expert helping users plan trips, find destinations, and optimize travel experiences.',
    domains: ['travel'],
  },
  techguru: {
    id: 'techguru',
    name: 'TechGuru AI',
    description: 'Digital life and technology assistance',
    icon: 'Laptop',
    color: 'bg-cyan-500',
    systemPrompt: 'You are a technology expert helping users with digital tools, subscriptions, and tech-related decisions.',
    domains: ['digital'],
  },
  insurebot: {
    id: 'insurebot',
    name: 'InsureBot',
    description: 'Insurance guidance and policy advice',
    icon: 'Shield',
    color: 'bg-emerald-500',
    systemPrompt: 'You are an insurance expert providing guidance on policies, coverage, and insurance-related decisions.',
    domains: ['insurance'],
  },
}


