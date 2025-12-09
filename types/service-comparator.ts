/**
 * Service Comparator AI Type Definitions
 * Comprehensive types for insurance, utilities, and service provider comparisons
 */

export type ServiceType =
  | 'insurance_auto'
  | 'insurance_home'
  | 'insurance_health'
  | 'insurance_life'
  | 'insurance_pet'
  | 'utility_electric'
  | 'utility_gas'
  | 'utility_water'
  | 'internet'
  | 'mobile'
  | 'loans'
  | 'credit_cards'
  | 'local_services';

export interface UserProfile {
  age?: number;
  zip: string;
  credit_tier?: 'excellent' | 'good' | 'fair' | 'poor';
  income?: number;
  driving_record?: 'clean' | 'minor_violations' | 'major_violations';
  claim_history?: number;
  property_details?: {
    home_age?: number;
    home_value?: number;
    square_feet?: number;
    construction_type?: string;
  };
  household_size?: number;
  risk_tolerance?: number; // 1-10
}

export interface UsageProfile {
  // Utilities
  monthly_usage_kwh?: number;
  monthly_usage_therms?: number;
  monthly_gallons?: number;
  
  // Internet/Mobile
  internet_speed_needs?: number; // Mbps
  call_minutes?: number;
  text_messages?: number;
  data_gb?: number;
  
  // Insurance
  miles_driven?: number;
  medical_visits_expected?: number;
  pet_age?: number;
  pet_breed?: string;
  
  // Financial
  purchase_volume?: number;
  rewards_categories?: string[];
}

export interface Preferences {
  deductible_range?: [number, number];
  coverage_limits?: Record<string, number>;
  add_ons?: string[];
  contract_length?: 'month-to-month' | '12-month' | '24-month' | 'no-preference';
  provider_bias?: {
    preferred?: string[];
    excluded?: string[];
  };
  budget_range?: [number, number];
  equipment_rental?: boolean;
  warranty_length?: number;
  urgency_level?: 'low' | 'medium' | 'high';
}

export interface MarketInfo {
  average_rate_city?: number;
  weather_risk?: number; // 0-100
  crime_index?: number; // 0-100
  fraud_risk?: number; // 0-100
  fed_rate?: number;
  grid_stability?: number; // 0-100
  coverage_map_quality?: number; // 0-100
  historical_price_volatility?: number; // 0-100
}

export interface ProviderData {
  name: string;
  base_price: number;
  fees?: {
    activation?: number;
    monthly?: number;
    early_termination?: number;
    equipment?: number;
  };
  coverage?: Record<string, number | string>;
  speed_or_limits?: Record<string, number | string>;
  restrictions?: string[];
  historical_changes?: {
    price_increases?: number;
    last_increase?: string;
    average_increase_percent?: number;
  };
  customer_score?: number; // 0-5
  financial_stability?: number; // 0-100
  warranty?: string;
  response_time?: string;
  service_area?: string[];
}

export interface ComparisonRequest {
  service_type: ServiceType;
  user_profile: UserProfile;
  usage_profile: UsageProfile;
  preferences: Preferences;
  market_info?: MarketInfo;
  provider_data?: ProviderData[];
}

export interface RankedProvider {
  rank: number;
  label: 'Best Value' | 'Cheapest' | 'Most Comprehensive' | 'Lowest Risk' | 'Best Long-Term';
  provider: string;
  value_score: number; // 0-100
  monthly_cost: number;
  annual_cost: number;
  reason: string;
}

export interface ProviderBreakdown {
  name: string;
  value_score: number;
  cost_analysis: {
    monthly_cost: number;
    annual_cost: number;
    hidden_fees: number;
    total_first_year: number;
    projected_3_year: number;
  };
  risk_analysis: {
    price_volatility: number; // 0-100
    coverage_gaps: string[];
    provider_stability: number; // 0-100
    claim_denial_likelihood: number; // 0-100
  };
  strengths: string[];
  weaknesses: string[];
  hidden_fees: Array<{
    name: string;
    amount: number;
    frequency: string;
  }>;
  warnings: string[];
}

export interface ComparisonResponse {
  summary: string;
  potential_savings: number;
  ranking: RankedProvider[];
  provider_breakdown: ProviderBreakdown[];
  personalized_insights: Array<{
    category: string;
    insight: string;
    confidence: number; // 0-100
    actionable: boolean;
  }>;
  comparison_date: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  insurance_auto: 'Auto Insurance',
  insurance_home: 'Home Insurance',
  insurance_health: 'Health Insurance',
  insurance_life: 'Life Insurance',
  insurance_pet: 'Pet Insurance',
  utility_electric: 'Electric Utility',
  utility_gas: 'Gas Utility',
  utility_water: 'Water Utility',
  internet: 'Internet Service',
  mobile: 'Mobile Phone',
  loans: 'Personal Loans',
  credit_cards: 'Credit Cards',
  local_services: 'Local Services',
};

export const SERVICE_CATEGORIES = {
  insurance: ['insurance_auto', 'insurance_home', 'insurance_health', 'insurance_life', 'insurance_pet'],
  utilities: ['utility_electric', 'utility_gas', 'utility_water'],
  telecom: ['internet', 'mobile'],
  financial: ['loans', 'credit_cards'],
  local: ['local_services'],
} as const;




























