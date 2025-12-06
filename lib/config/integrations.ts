/**
 * External Integration Configurations
 * Defines all available integrations with OAuth URLs, scopes, and setup info
 */

import {
  DollarSign, Heart, Home, Car,
  Mail, Cloud,
  Tv, Target,
  type LucideIcon
} from 'lucide-react'

export type AuthType = 'oauth' | 'api_key'
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'expired'

export interface IntegrationService {
  id: string
  name: string
  description: string
  tier: 1 | 2 | 3
  category: string
  features: string[]
  authType: AuthType
  website: string
  logoUrl?: string
  // OAuth configuration
  oauthUrl?: string
  scopes?: string[]
  // Environment variables needed
  clientIdEnv?: string
  clientSecretEnv?: string
  apiKeyEnv?: string
  // Setup instructions
  setupGuide?: string
  developerPortal?: string
  // Pricing info
  pricing?: 'free' | 'freemium' | 'paid'
}

export interface IntegrationDomain {
  id: string
  name: string
  icon: LucideIcon
  color: string
  services: IntegrationService[]
}

export const INTEGRATIONS: Record<string, IntegrationDomain> = {
  financial: {
    id: 'financial',
    name: 'Financial',
    icon: DollarSign,
    color: '#10b981',
    services: [
      {
        id: 'plaid',
        name: 'Plaid',
        description: 'Connect 12,000+ banks and credit cards for automatic transaction sync',
        tier: 1,
        category: 'Banking',
        features: ['Real-time balances', 'Transaction history', 'Investment accounts', 'Liability tracking'],
        authType: 'oauth',
        website: 'https://plaid.com',
        oauthUrl: 'plaid-link', // Special handling - uses Plaid Link SDK
        clientIdEnv: 'PLAID_CLIENT_ID',
        clientSecretEnv: 'PLAID_SECRET',
        developerPortal: 'https://dashboard.plaid.com',
        setupGuide: 'Sign up at plaid.com, create an app, and get your API keys from the dashboard.',
        pricing: 'freemium',
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Payment processing and revenue tracking for businesses',
        tier: 2,
        category: 'Payments',
        features: ['Transaction history', 'Revenue analytics', 'Invoice tracking', 'Subscription management'],
        authType: 'api_key',
        website: 'https://stripe.com',
        apiKeyEnv: 'STRIPE_SECRET_KEY',
        developerPortal: 'https://dashboard.stripe.com/apikeys',
        setupGuide: 'Go to Stripe Dashboard > Developers > API Keys and copy your Secret key.',
        pricing: 'freemium',
      },
      {
        id: 'coinbase',
        name: 'Coinbase',
        description: 'Cryptocurrency portfolio tracking and price alerts',
        tier: 2,
        category: 'Crypto',
        features: ['Portfolio tracking', 'Transaction history', 'Price alerts', 'Tax reports'],
        authType: 'oauth',
        website: 'https://www.coinbase.com',
        oauthUrl: 'https://www.coinbase.com/oauth/authorize',
        scopes: ['wallet:accounts:read', 'wallet:transactions:read'],
        clientIdEnv: 'COINBASE_CLIENT_ID',
        clientSecretEnv: 'COINBASE_CLIENT_SECRET',
        developerPortal: 'https://www.coinbase.com/settings/api',
        setupGuide: 'Create an OAuth app in Coinbase Settings > API to get credentials.',
        pricing: 'free',
      },
      {
        id: 'ynab',
        name: 'YNAB',
        description: 'You Need A Budget - Zero-based budgeting sync',
        tier: 2,
        category: 'Budgeting',
        features: ['Budget categories', 'Goal tracking', 'Spending reports', 'Account sync'],
        authType: 'api_key',
        website: 'https://www.youneedabudget.com',
        apiKeyEnv: 'YNAB_API_KEY',
        developerPortal: 'https://app.youneedabudget.com/settings/developer',
        setupGuide: 'Go to YNAB Settings > Developer Settings and create a Personal Access Token.',
        pricing: 'paid',
      },
    ]
  },
  health: {
    id: 'health',
    name: 'Health & Wellness',
    icon: Heart,
    color: '#ef4444',
    services: [
      {
        id: 'fitbit',
        name: 'Fitbit',
        description: 'Sync fitness data, sleep, and heart rate from Fitbit devices',
        tier: 1,
        category: 'Wearables',
        features: ['Steps & activity', 'Heart rate', 'Sleep tracking', 'Exercise logs'],
        authType: 'oauth',
        website: 'https://www.fitbit.com',
        oauthUrl: 'https://www.fitbit.com/oauth2/authorize',
        scopes: ['activity', 'heartrate', 'sleep', 'weight', 'profile'],
        clientIdEnv: 'FITBIT_CLIENT_ID',
        clientSecretEnv: 'FITBIT_CLIENT_SECRET',
        developerPortal: 'https://dev.fitbit.com/apps',
        setupGuide: 'Register an app at dev.fitbit.com to get OAuth credentials.',
        pricing: 'free',
      },
      {
        id: 'strava',
        name: 'Strava',
        description: 'Running, cycling, and workout activity tracking',
        tier: 2,
        category: 'Fitness',
        features: ['Activity tracking', 'Route maps', 'Performance stats', 'Training log'],
        authType: 'oauth',
        website: 'https://www.strava.com',
        oauthUrl: 'https://www.strava.com/oauth/authorize',
        scopes: ['read', 'activity:read'],
        clientIdEnv: 'STRAVA_CLIENT_ID',
        clientSecretEnv: 'STRAVA_CLIENT_SECRET',
        developerPortal: 'https://www.strava.com/settings/api',
        setupGuide: 'Create an API application at strava.com/settings/api.',
        pricing: 'freemium',
      },
      {
        id: 'myfitnesspal',
        name: 'MyFitnessPal',
        description: 'Nutrition tracking and calorie counting',
        tier: 2,
        category: 'Nutrition',
        features: ['Food logging', 'Calorie tracking', 'Macro nutrients', 'Weight log'],
        authType: 'oauth',
        website: 'https://www.myfitnesspal.com',
        oauthUrl: 'https://www.myfitnesspal.com/oauth2/authorize',
        scopes: ['diary', 'measurements'],
        clientIdEnv: 'MFP_CLIENT_ID',
        clientSecretEnv: 'MFP_CLIENT_SECRET',
        developerPortal: 'https://www.myfitnesspal.com/api',
        setupGuide: 'Apply for API access at myfitnesspal.com/api.',
        pricing: 'freemium',
      },
      {
        id: 'withings',
        name: 'Withings',
        description: 'Smart scales, blood pressure monitors, and sleep tracking',
        tier: 2,
        category: 'Health Devices',
        features: ['Weight & body composition', 'Blood pressure', 'Sleep quality', 'ECG'],
        authType: 'oauth',
        website: 'https://www.withings.com',
        oauthUrl: 'https://account.withings.com/oauth2_user/authorize2',
        scopes: ['user.metrics', 'user.activity'],
        clientIdEnv: 'WITHINGS_CLIENT_ID',
        clientSecretEnv: 'WITHINGS_CLIENT_SECRET',
        developerPortal: 'https://developer.withings.com',
        setupGuide: 'Create an app at developer.withings.com.',
        pricing: 'free',
      },
    ]
  },
  productivity: {
    id: 'productivity',
    name: 'Productivity',
    icon: Target,
    color: '#8b5cf6',
    services: [
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Sync events, reminders, and availability',
        tier: 1,
        category: 'Calendar',
        features: ['Event sync', 'Reminders', 'Availability', 'Multiple calendars'],
        authType: 'oauth',
        website: 'https://calendar.google.com',
        oauthUrl: 'built-in', // Uses NextAuth Google provider
        scopes: ['https://www.googleapis.com/auth/calendar'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        developerPortal: 'https://console.cloud.google.com/apis/credentials',
        setupGuide: 'Already configured via Google Sign-In. Ensure calendar scope is enabled.',
        pricing: 'free',
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'All-in-one workspace - notes, databases, and wikis',
        tier: 2,
        category: 'Notes',
        features: ['Databases sync', 'Page access', 'Task tracking', 'Knowledge base'],
        authType: 'oauth',
        website: 'https://www.notion.so',
        oauthUrl: 'https://api.notion.com/v1/oauth/authorize',
        scopes: [],
        clientIdEnv: 'NOTION_CLIENT_ID',
        clientSecretEnv: 'NOTION_CLIENT_SECRET',
        developerPortal: 'https://www.notion.so/my-integrations',
        setupGuide: 'Create an integration at notion.so/my-integrations.',
        pricing: 'freemium',
      },
      {
        id: 'todoist',
        name: 'Todoist',
        description: 'Task management and to-do lists',
        tier: 2,
        category: 'Tasks',
        features: ['Task sync', 'Projects', 'Labels', 'Due dates'],
        authType: 'api_key',
        website: 'https://todoist.com',
        apiKeyEnv: 'TODOIST_API_KEY',
        developerPortal: 'https://developer.todoist.com',
        setupGuide: 'Get your API token from Todoist Settings > Integrations > Developer.',
        pricing: 'freemium',
      },
      {
        id: 'trello',
        name: 'Trello',
        description: 'Kanban boards and project management',
        tier: 2,
        category: 'Project Management',
        features: ['Board sync', 'Cards', 'Checklists', 'Due dates'],
        authType: 'api_key',
        website: 'https://trello.com',
        apiKeyEnv: 'TRELLO_API_KEY',
        developerPortal: 'https://trello.com/power-ups/admin',
        setupGuide: 'Get your API key from trello.com/app-key.',
        pricing: 'freemium',
      },
      {
        id: 'linear',
        name: 'Linear',
        description: 'Modern issue tracking for software teams',
        tier: 3,
        category: 'Project Management',
        features: ['Issue sync', 'Projects', 'Cycles', 'Roadmaps'],
        authType: 'api_key',
        website: 'https://linear.app',
        apiKeyEnv: 'LINEAR_API_KEY',
        developerPortal: 'https://linear.app/settings/api',
        setupGuide: 'Create a Personal API Key in Linear Settings > API.',
        pricing: 'freemium',
      },
    ]
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    icon: Mail,
    color: '#3b82f6',
    services: [
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Email parsing and smart suggestions',
        tier: 1,
        category: 'Email',
        features: ['Email sync', 'Smart categorization', 'Action suggestions', 'Labels'],
        authType: 'oauth',
        website: 'https://mail.google.com',
        oauthUrl: 'built-in',
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        developerPortal: 'https://console.cloud.google.com/apis/credentials',
        setupGuide: 'Already configured via Google Sign-In. Ensure Gmail scope is enabled.',
        pricing: 'free',
      },
      {
        id: 'twilio',
        name: 'Twilio',
        description: 'SMS notifications and voice calls',
        tier: 2,
        category: 'SMS/Voice',
        features: ['Send SMS', 'Voice calls', 'Message logs', 'Notifications'],
        authType: 'api_key',
        website: 'https://www.twilio.com',
        apiKeyEnv: 'TWILIO_AUTH_TOKEN',
        developerPortal: 'https://console.twilio.com',
        setupGuide: 'Get your Account SID and Auth Token from the Twilio Console.',
        pricing: 'paid',
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team messaging and notifications',
        tier: 3,
        category: 'Messaging',
        features: ['Send messages', 'Channel access', 'Notifications', 'Files'],
        authType: 'oauth',
        website: 'https://slack.com',
        oauthUrl: 'https://slack.com/oauth/v2/authorize',
        scopes: ['chat:write', 'channels:read'],
        clientIdEnv: 'SLACK_CLIENT_ID',
        clientSecretEnv: 'SLACK_CLIENT_SECRET',
        developerPortal: 'https://api.slack.com/apps',
        setupGuide: 'Create a Slack App at api.slack.com/apps.',
        pricing: 'freemium',
      },
    ]
  },
  storage: {
    id: 'storage',
    name: 'Cloud Storage',
    icon: Cloud,
    color: '#06b6d4',
    services: [
      {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Cloud file storage and document management',
        tier: 1,
        category: 'Storage',
        features: ['File upload', 'Document sync', 'Sharing', 'Search'],
        authType: 'oauth',
        website: 'https://drive.google.com',
        oauthUrl: 'built-in',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        developerPortal: 'https://console.cloud.google.com/apis/credentials',
        setupGuide: 'Already configured via Google Sign-In.',
        pricing: 'freemium',
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'File sync and cloud storage',
        tier: 2,
        category: 'Storage',
        features: ['File sync', 'Sharing', 'Version history', 'Team folders'],
        authType: 'oauth',
        website: 'https://www.dropbox.com',
        oauthUrl: 'https://www.dropbox.com/oauth2/authorize',
        scopes: ['files.content.read', 'files.content.write'],
        clientIdEnv: 'DROPBOX_CLIENT_ID',
        clientSecretEnv: 'DROPBOX_CLIENT_SECRET',
        developerPortal: 'https://www.dropbox.com/developers/apps',
        setupGuide: 'Create an app at dropbox.com/developers/apps.',
        pricing: 'freemium',
      },
    ]
  },
  home: {
    id: 'home',
    name: 'Home & Property',
    icon: Home,
    color: '#f59e0b',
    services: [
      {
        id: 'zillow',
        name: 'Zillow',
        description: 'Home value estimates and market data',
        tier: 2,
        category: 'Real Estate',
        features: ['Zestimate', 'Market trends', 'Comparable sales', 'Neighborhood data'],
        authType: 'api_key',
        website: 'https://www.zillow.com',
        apiKeyEnv: 'ZILLOW_API_KEY',
        developerPortal: 'https://www.zillow.com/howto/api/APIOverview.htm',
        setupGuide: 'Apply for a Zillow API key (limited availability).',
        pricing: 'freemium',
      },
      {
        id: 'nest',
        name: 'Google Nest',
        description: 'Smart thermostat and home devices',
        tier: 3,
        category: 'Smart Home',
        features: ['Temperature control', 'Energy usage', 'Schedule', 'Away mode'],
        authType: 'oauth',
        website: 'https://home.nest.com',
        oauthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: ['https://www.googleapis.com/auth/sdm.service'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        developerPortal: 'https://console.nest.google.com/device-access',
        setupGuide: 'Enable Device Access in Google Cloud Console.',
        pricing: 'free',
      },
    ]
  },
  vehicles: {
    id: 'vehicles',
    name: 'Vehicles',
    icon: Car,
    color: '#06b6d4',
    services: [
      {
        id: 'smartcar',
        name: 'Smartcar',
        description: 'Connected car data from 35+ brands',
        tier: 2,
        category: 'Telematics',
        features: ['Odometer', 'Fuel level', 'Location', 'Vehicle info'],
        authType: 'oauth',
        website: 'https://smartcar.com',
        oauthUrl: 'https://connect.smartcar.com/oauth/authorize',
        scopes: ['read_vehicle_info', 'read_odometer', 'read_fuel'],
        clientIdEnv: 'SMARTCAR_CLIENT_ID',
        clientSecretEnv: 'SMARTCAR_CLIENT_SECRET',
        developerPortal: 'https://dashboard.smartcar.com',
        setupGuide: 'Create an app at smartcar.com/developers.',
        pricing: 'freemium',
      },
      {
        id: 'tesla',
        name: 'Tesla',
        description: 'Tesla vehicle data and controls',
        tier: 2,
        category: 'Electric Vehicles',
        features: ['Battery status', 'Charging', 'Climate control', 'Location'],
        authType: 'oauth',
        website: 'https://www.tesla.com',
        oauthUrl: 'https://auth.tesla.com/oauth2/v3/authorize',
        scopes: ['openid', 'vehicle_device_data'],
        clientIdEnv: 'TESLA_CLIENT_ID',
        clientSecretEnv: 'TESLA_CLIENT_SECRET',
        developerPortal: 'https://developer.tesla.com',
        setupGuide: 'Register at developer.tesla.com for API access.',
        pricing: 'free',
      },
    ]
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment',
    icon: Tv,
    color: '#ec4899',
    services: [
      {
        id: 'spotify',
        name: 'Spotify',
        description: 'Music streaming stats and playlists',
        tier: 2,
        category: 'Music',
        features: ['Listening history', 'Top tracks', 'Playlists', 'Currently playing'],
        authType: 'oauth',
        website: 'https://www.spotify.com',
        oauthUrl: 'https://accounts.spotify.com/authorize',
        scopes: ['user-read-recently-played', 'user-top-read', 'playlist-read-private'],
        clientIdEnv: 'SPOTIFY_CLIENT_ID',
        clientSecretEnv: 'SPOTIFY_CLIENT_SECRET',
        developerPortal: 'https://developer.spotify.com/dashboard',
        setupGuide: 'Create an app at developer.spotify.com/dashboard.',
        pricing: 'free',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        description: 'Watch history and subscriptions',
        tier: 3,
        category: 'Video',
        features: ['Watch history', 'Subscriptions', 'Liked videos', 'Playlists'],
        authType: 'oauth',
        website: 'https://www.youtube.com',
        oauthUrl: 'built-in',
        scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        developerPortal: 'https://console.cloud.google.com/apis/credentials',
        setupGuide: 'Enable YouTube Data API in Google Cloud Console.',
        pricing: 'free',
      },
    ]
  },
  weather: {
    id: 'weather',
    name: 'Weather & Location',
    icon: Cloud,
    color: '#0ea5e9',
    services: [
      {
        id: 'openweather',
        name: 'OpenWeatherMap',
        description: 'Weather forecasts and current conditions',
        tier: 2,
        category: 'Weather',
        features: ['Current weather', '7-day forecast', 'Alerts', 'Historical data'],
        authType: 'api_key',
        website: 'https://openweathermap.org',
        apiKeyEnv: 'OPENWEATHER_API_KEY',
        developerPortal: 'https://home.openweathermap.org/api_keys',
        setupGuide: 'Sign up at openweathermap.org and get a free API key.',
        pricing: 'freemium',
      },
    ]
  },
}

// Helper function to get all services flattened
export function getAllServices(): IntegrationService[] {
  return Object.values(INTEGRATIONS).flatMap(domain => domain.services)
}

// Helper to get service by ID
export function getServiceById(id: string): IntegrationService | undefined {
  return getAllServices().find(service => service.id === id)
}

// Get tier 1 (must-have) services
export function getTier1Services(): IntegrationService[] {
  return getAllServices().filter(service => service.tier === 1)
}

// Count services by tier
export function getServiceCountByTier(): Record<number, number> {
  const services = getAllServices()
  return {
    1: services.filter(s => s.tier === 1).length,
    2: services.filter(s => s.tier === 2).length,
    3: services.filter(s => s.tier === 3).length,
  }
}

