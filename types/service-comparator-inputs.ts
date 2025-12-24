/**
 * Comprehensive Service Comparator Input Types
 * Detailed input schemas for accurate service comparison estimates
 */

// ============================================================================
// AUTO INSURANCE INPUTS
// ============================================================================
export interface AutoInsuranceInputs {
  // Vehicle Information
  vehicles: VehicleInfo[];
  
  // Driver Information
  drivers: DriverInfo[];
  
  // Coverage Preferences
  coverage: AutoCoveragePreferences;
  
  // Discount Qualifications
  discounts: AutoDiscountQualifications;
  
  // Current Policy (for comparison)
  currentPolicy?: CurrentAutoPolicy;
}

export interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  ownershipStatus: 'owned' | 'financed' | 'leased';
  primaryUse: 'commute' | 'business' | 'pleasure' | 'rideshare';
  annualMileage: number;
  garageLocation: 'garage' | 'carport' | 'driveway' | 'street';
  antiTheftDevices: string[];
  safetyFeatures: string[];
}

export interface DriverInfo {
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'domestic_partner' | 'divorced' | 'widowed';
  licenseState: string;
  licenseYears: number;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  educationLevel: 'high_school' | 'associates' | 'bachelors' | 'masters' | 'doctorate';
  occupation?: string;
  employer?: string;
  
  // Driving Record
  drivingRecord: {
    accidents: AccidentRecord[];
    violations: ViolationRecord[];
    claims: ClaimRecord[];
    suspensions: boolean;
    sr22Required: boolean;
  };
  
  // Driving Courses
  completedCourses: string[];
}

export interface AccidentRecord {
  date: string;
  atFault: boolean;
  severity: 'minor' | 'moderate' | 'major';
  totalDamage: number;
  injuries: boolean;
}

export interface ViolationRecord {
  date: string;
  type: 'speeding' | 'dui' | 'reckless' | 'failure_to_stop' | 'distracted' | 'other';
  points?: number;
}

export interface ClaimRecord {
  date: string;
  type: 'collision' | 'comprehensive' | 'liability' | 'medical' | 'uninsured';
  amount: number;
}

export interface AutoCoveragePreferences {
  liabilityBodily: '25/50' | '50/100' | '100/300' | '250/500' | '500/500';
  liabilityProperty: number;
  uninsuredMotorist: boolean;
  underinsuredMotorist: boolean;
  medicalPayments: number;
  personalInjuryProtection: boolean;
  collisionDeductible: 0 | 250 | 500 | 1000 | 2000;
  comprehensiveDeductible: 0 | 250 | 500 | 1000 | 2000;
  rentalReimbursement: boolean;
  roadsideAssistance: boolean;
  gapCoverage: boolean;
  newCarReplacement: boolean;
  rideshareEndorsement: boolean;
  customEquipment: number;
}

export interface AutoDiscountQualifications {
  multiPolicy: boolean;
  multiVehicle: boolean;
  goodDriver: boolean;
  goodStudent: boolean;
  distantStudent: boolean;
  defensiveDriving: boolean;
  antiTheft: boolean;
  lowMileage: boolean;
  payInFull: boolean;
  paperless: boolean;
  autopay: boolean;
  militaryVeteran: boolean;
  professionalMemberships: string[];
  telematics: boolean;
  homeowner: boolean;
}

export interface CurrentAutoPolicy {
  carrier: string;
  premium: number;
  expirationDate: string;
  coverageLimits: string;
  yearsWithCarrier: number;
}

// ============================================================================
// HOME INSURANCE INPUTS
// ============================================================================
export interface HomeInsuranceInputs {
  // Property Information
  property: PropertyInfo;
  
  // Construction Details
  construction: ConstructionDetails;
  
  // Safety & Security
  safety: SafetyFeatures;
  
  // Coverage Preferences
  coverage: HomeCoveragePreferences;
  
  // Discount Qualifications
  discounts: HomeDiscountQualifications;
  
  // Claims History
  claimsHistory: HomeClaimRecord[];
  
  // Current Policy
  currentPolicy?: CurrentHomePolicy;
}

export interface PropertyInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'mobile_home' | 'manufactured';
  ownershipStatus: 'primary' | 'secondary' | 'rental' | 'vacant';
  occupancy: 'owner_occupied' | 'tenant_occupied' | 'vacation' | 'vacant';
  yearBuilt: number;
  squareFootage: number;
  stories: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  basementType: 'full' | 'partial' | 'crawl' | 'slab' | 'none';
  basementFinished: boolean;
  garageType: 'attached' | 'detached' | 'carport' | 'none';
  garageSize: number;
  poolType: 'inground' | 'above_ground' | 'none';
  fencedYard: boolean;
  trampolinePresent: boolean;
  dogBreeds: string[];
  estimatedValue: number;
  purchasePrice: number;
  purchaseDate: string;
}

export interface ConstructionDetails {
  exteriorWalls: 'brick' | 'stone' | 'stucco' | 'vinyl' | 'wood' | 'aluminum' | 'fiber_cement' | 'other';
  roofType: 'asphalt_shingle' | 'tile' | 'metal' | 'slate' | 'wood_shake' | 'flat' | 'other';
  roofAge: number;
  foundation: 'poured_concrete' | 'block' | 'stone' | 'pier' | 'other';
  heatingType: 'central_gas' | 'central_electric' | 'heat_pump' | 'oil' | 'propane' | 'wood' | 'other';
  coolingType: 'central_air' | 'window_units' | 'evaporative' | 'none';
  waterHeater: 'gas' | 'electric' | 'tankless' | 'solar' | 'heat_pump';
  electricalType: 'circuit_breaker' | 'fuse_box';
  electricalAmps: 60 | 100 | 150 | 200 | 400;
  plumbingType: 'copper' | 'pvc' | 'galvanized' | 'polybutylene' | 'pex';
  wiringType: 'copper' | 'aluminum' | 'knob_and_tube';
  
  // Updates & Renovations
  updates: {
    roof: number | null;
    electrical: number | null;
    plumbing: number | null;
    heating: number | null;
    kitchen: number | null;
    bathroom: number | null;
  };
}

export interface SafetyFeatures {
  smokeDetectors: 'none' | 'battery' | 'hardwired' | 'monitored';
  carbonMonoxideDetectors: boolean;
  fireExtinguishers: boolean;
  sprinklerSystem: boolean;
  fireAlarm: 'none' | 'local' | 'central_station';
  burglarAlarm: 'none' | 'local' | 'central_station';
  securityCameras: boolean;
  deadboltLocks: boolean;
  gatedCommunity: boolean;
  nearFireStation: boolean;
  nearFireHydrant: boolean;
  stormShutters: boolean;
  impactResistantRoof: boolean;
  generatorBackup: boolean;
  sumpPump: boolean;
  waterLeakDetectors: boolean;
}

export interface HomeCoveragePreferences {
  dwellingCoverage: number;
  otherStructures: number;
  personalProperty: number;
  lossOfUse: number;
  personalLiability: number;
  medicalPayments: number;
  deductible: number;
  hurricaneDeductible?: number;
  earthquakeDeductible?: number;
  
  // Additional Coverages
  waterBackup: boolean;
  equipmentBreakdown: boolean;
  identityTheft: boolean;
  homeBusinessCoverage: boolean;
  scheduledPersonalProperty: ScheduledItem[];
  floodInsurance: boolean;
  earthquakeInsurance: boolean;
  windstormInsurance: boolean;
  umbrellaPolicy: boolean;
  umbrellaAmount?: number;
}

export interface ScheduledItem {
  category: 'jewelry' | 'art' | 'electronics' | 'collectibles' | 'musical_instruments' | 'firearms' | 'other';
  description: string;
  value: number;
}

export interface HomeDiscountQualifications {
  newHome: boolean;
  newRoof: boolean;
  claimFree: number;
  multiPolicy: boolean;
  payInFull: boolean;
  paperless: boolean;
  autopay: boolean;
  professionalMemberships: string[];
  seniorDiscount: boolean;
  retiredDiscount: boolean;
  loyaltyYears: number;
}

export interface HomeClaimRecord {
  date: string;
  type: 'fire' | 'water' | 'theft' | 'weather' | 'liability' | 'other';
  amount: number;
  description: string;
}

export interface CurrentHomePolicy {
  carrier: string;
  premium: number;
  expirationDate: string;
  dwellingCoverage: number;
  deductible: number;
  yearsWithCarrier: number;
}

// ============================================================================
// HEALTH INSURANCE INPUTS
// ============================================================================
export interface HealthInsuranceInputs {
  // Household Information
  household: HealthHouseholdInfo;
  
  // Health Profile
  healthProfile: HealthProfileInfo[];
  
  // Coverage Preferences
  coverage: HealthCoveragePreferences;
  
  // Financial Information
  financial: HealthFinancialInfo;
  
  // Current Coverage
  currentCoverage?: CurrentHealthCoverage;
}

export interface HealthHouseholdInfo {
  primaryApplicant: {
    dateOfBirth: string;
    gender: 'male' | 'female';
    tobaccoUser: boolean;
    pregnant: boolean;
    disabled: boolean;
  };
  spouse?: {
    dateOfBirth: string;
    gender: 'male' | 'female';
    tobaccoUser: boolean;
    pregnant: boolean;
    disabled: boolean;
  };
  dependents: {
    dateOfBirth: string;
    gender: 'male' | 'female';
    relationship: 'child' | 'stepchild' | 'foster_child' | 'other';
    disabled: boolean;
    student: boolean;
  }[];
  zipCode: string;
  county: string;
}

export interface HealthProfileInfo {
  memberId: string;
  preExistingConditions: string[];
  currentMedications: {
    name: string;
    type: 'generic' | 'brand' | 'specialty';
    monthlyRefills: number;
  }[];
  expectedServices: {
    primaryCareVisits: number;
    specialistVisits: number;
    labTests: number;
    imagingTests: number;
    surgeries: number;
    emergencyVisits: number;
    urgentCareVisits: number;
    physicalTherapy: number;
    mentalHealthVisits: number;
  };
  preferredProviders: {
    doctors: string[];
    hospitals: string[];
    pharmacies: string[];
  };
}

export interface HealthCoveragePreferences {
  planType: 'hmo' | 'ppo' | 'epo' | 'pos' | 'hdhp' | 'any';
  metalTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'catastrophic' | 'any';
  maxMonthlyPremium: number;
  maxDeductible: number;
  maxOutOfPocketMax: number;
  
  // Priority Features
  priorities: {
    lowPremium: number;
    lowDeductible: number;
    lowCopays: number;
    wideNetwork: number;
    telemedicine: number;
    prescriptionCoverage: number;
    mentalHealth: number;
    maternityCarе: number;
    pediatricDental: number;
    pediatricVision: number;
  };
  
  // Specific Needs
  hsaCompatible: boolean;
  nationalNetwork: boolean;
  internationalCoverage: boolean;
}

export interface HealthFinancialInfo {
  annualHouseholdIncome: number;
  employerContribution?: number;
  hsaBalance?: number;
  expectedMedicalExpenses: number;
  taxFilingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
}

export interface CurrentHealthCoverage {
  carrier: string;
  planName: string;
  monthlyPremium: number;
  deductible: number;
  outOfPocketMax: number;
  planType: string;
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
  reasonForChange: string[];
}

// ============================================================================
// LIFE INSURANCE INPUTS
// ============================================================================
export interface LifeInsuranceInputs {
  // Personal Information
  personal: LifePersonalInfo;
  
  // Health Information
  health: LifeHealthInfo;
  
  // Financial Information
  financial: LifeFinancialInfo;
  
  // Coverage Needs
  coverage: LifeCoverageNeeds;
  
  // Beneficiary Information
  beneficiaries: BeneficiaryInfo[];
}

export interface LifePersonalInfo {
  dateOfBirth: string;
  gender: 'male' | 'female';
  height: { feet: number; inches: number };
  weight: number;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  citizenship: string;
  occupation: string;
  employer: string;
  annualIncome: number;
  netWorth: number;
  
  // Lifestyle
  tobaccoUse: 'never' | 'former' | 'current';
  lastTobaccoUse?: string;
  alcoholUse: 'none' | 'occasional' | 'moderate' | 'heavy';
  marijuanaUse: boolean;
  recreationalDrugs: boolean;
  
  // Activities
  dangerousHobbies: string[];
  aviationActivity: 'none' | 'private_pilot' | 'commercial' | 'military';
  scubaDiving: boolean;
  skydiving: boolean;
  mountainClimbing: boolean;
  racing: boolean;
  
  // Travel
  foreignTravel: {
    countries: string[];
    frequency: 'rarely' | 'occasionally' | 'frequently';
  };
}

export interface LifeHealthInfo {
  generalHealth: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Medical History
  conditions: {
    condition: string;
    diagnosedDate: string;
    currentStatus: 'active' | 'controlled' | 'resolved';
    medications: string[];
  }[];
  
  // Family History
  familyHistory: {
    heartDisease: boolean;
    cancer: boolean;
    diabetes: boolean;
    stroke: boolean;
    alzheimers: boolean;
    ageAtDeath?: number;
  };
  
  // Recent Medical
  recentHospitalizations: {
    date: string;
    reason: string;
    duration: number;
  }[];
  
  lastPhysical: string;
  bloodPressure?: { systolic: number; diastolic: number };
  cholesterol?: { total: number; ldl: number; hdl: number };
  
  // Mental Health
  mentalHealthHistory: boolean;
  currentTreatment: boolean;
}

export interface LifeFinancialInfo {
  existingLifeInsurance: {
    carrier: string;
    faceAmount: number;
    type: string;
    monthlyPremium: number;
  }[];
  
  debts: {
    mortgage: number;
    carLoans: number;
    studentLoans: number;
    creditCards: number;
    otherDebts: number;
  };
  
  dependents: {
    children: number;
    childrenAges: number[];
    elderlyDependents: number;
    collegeYearsNeeded: number;
  };
  
  retirementAccounts: number;
  liquidAssets: number;
  businessOwnership: boolean;
  businessValue?: number;
}

export interface LifeCoverageNeeds {
  coverageAmount: number;
  policyType: 'term' | 'whole_life' | 'universal' | 'variable' | 'final_expense';
  termLength?: 10 | 15 | 20 | 25 | 30;
  purpose: string[];
  riders: string[];
  paymentFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  acceleratedUnderwriting: boolean;
}

export interface BeneficiaryInfo {
  name: string;
  relationship: string;
  percentage: number;
  type: 'primary' | 'contingent';
}

// ============================================================================
// PET INSURANCE INPUTS
// ============================================================================
export interface PetInsuranceInputs {
  pets: PetInfo[];
  coverage: PetCoveragePreferences;
  currentPolicy?: CurrentPetPolicy;
}

export interface PetInfo {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'exotic';
  breed: string;
  mixedBreed: boolean;
  dateOfBirth: string;
  gender: 'male' | 'female';
  spayedNeutered: boolean;
  weight: number;
  
  // Health History
  preExistingConditions: string[];
  chronicConditions: string[];
  previousSurgeries: string[];
  currentMedications: string[];
  
  // Lifestyle
  indoorOnly: boolean;
  workingAnimal: boolean;
  showAnimal: boolean;
}

export interface PetCoveragePreferences {
  coverageType: 'accident_only' | 'accident_illness' | 'comprehensive';
  annualLimit: 'unlimited' | 5000 | 10000 | 15000 | 20000;
  reimbursementPercent: 70 | 80 | 90 | 100;
  deductible: 0 | 100 | 250 | 500 | 750 | 1000;
  deductibleType: 'annual' | 'per_incident';
  
  // Add-ons
  wellnessCoverage: boolean;
  dentalCoverage: boolean;
  behavioralCoverage: boolean;
  alternativeTherapy: boolean;
  prescriptionFood: boolean;
  breedSpecificCoverage: boolean;
}

export interface CurrentPetPolicy {
  carrier: string;
  monthlyPremium: number;
  annualLimit: number;
  deductible: number;
  reimbursementPercent: number;
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
}

// ============================================================================
// UTILITY INPUTS - ELECTRIC
// ============================================================================
export interface ElectricUtilityInputs {
  // Property Information
  property: UtilityPropertyInfo;
  
  // Usage Information
  usage: ElectricUsageInfo;
  
  // Equipment
  equipment: ElectricEquipmentInfo;
  
  // Preferences
  preferences: ElectricPreferences;
  
  // Current Service
  currentService?: CurrentElectricService;
}

export interface UtilityPropertyInfo {
  address: string;
  zipCode: string;
  propertyType: 'single_family' | 'multi_family' | 'condo' | 'apartment' | 'mobile_home' | 'commercial';
  squareFootage: number;
  yearBuilt: number;
  stories: number;
  occupants: number;
  homeOwnership: 'own' | 'rent';
}

export interface ElectricUsageInfo {
  // Historical Usage
  monthlyUsageKwh: {
    january: number;
    february: number;
    march: number;
    april: number;
    may: number;
    june: number;
    july: number;
    august: number;
    september: number;
    october: number;
    november: number;
    december: number;
  };
  
  // Peak Usage
  peakUsageTimes: string[];
  weekendUsagePattern: 'higher' | 'lower' | 'same';
  workFromHome: boolean;
  workFromHomeDays: number;
  
  // Seasonal Factors
  summerCooling: 'heavy' | 'moderate' | 'light' | 'none';
  winterHeating: 'heavy' | 'moderate' | 'light' | 'none';
  poolPumpUsage: boolean;
  hotTubUsage: boolean;
}

export interface ElectricEquipmentInfo {
  heatingType: 'electric_furnace' | 'heat_pump' | 'baseboard' | 'gas' | 'oil' | 'none';
  coolingType: 'central_ac' | 'window_units' | 'mini_split' | 'evaporative' | 'none';
  waterHeaterType: 'electric' | 'gas' | 'tankless_electric' | 'heat_pump' | 'solar';
  applianceAges: {
    hvac: number;
    waterHeater: number;
    refrigerator: number;
    washerDryer: number;
  };
  
  // Energy Efficiency
  smartThermostat: boolean;
  ledLighting: boolean;
  energyStarAppliances: number;
  insulationQuality: 'poor' | 'average' | 'good' | 'excellent';
  windowType: 'single_pane' | 'double_pane' | 'triple_pane';
  
  // EV & Solar
  electricVehicle: boolean;
  evChargingLevel: 1 | 2 | 3 | null;
  solarPanels: boolean;
  solarCapacityKw?: number;
  batteryStorage: boolean;
  batteryCapacityKwh?: number;
}

export interface ElectricPreferences {
  planType: 'fixed_rate' | 'variable_rate' | 'indexed' | 'time_of_use' | 'prepaid' | 'any';
  contractLength: 'month_to_month' | '6_months' | '12_months' | '24_months' | '36_months' | 'no_preference';
  renewableEnergy: 'required' | 'preferred' | 'no_preference';
  renewablePercent?: number;
  
  // Rate Priorities
  priorities: {
    lowestRate: number;
    priceStability: number;
    greenEnergy: number;
    noContractFees: number;
    localCompany: number;
    customerService: number;
  };
  
  // Budget
  maxMonthlyBudget?: number;
  budgetBilling: boolean;
}

export interface CurrentElectricService {
  provider: string;
  planType: string;
  averageMonthlyBill: number;
  ratePerKwh: number;
  contractEndDate?: string;
  earlyTerminationFee?: number;
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
  reasonForChange: string[];
}

// ============================================================================
// UTILITY INPUTS - GAS
// ============================================================================
export interface GasUtilityInputs {
  property: UtilityPropertyInfo;
  usage: GasUsageInfo;
  equipment: GasEquipmentInfo;
  preferences: GasPreferences;
  currentService?: CurrentGasService;
}

export interface GasUsageInfo {
  monthlyUsageTherms: {
    january: number;
    february: number;
    march: number;
    april: number;
    may: number;
    june: number;
    july: number;
    august: number;
    september: number;
    october: number;
    november: number;
    december: number;
  };
  primaryGasUses: ('heating' | 'water_heating' | 'cooking' | 'dryer' | 'pool_heater' | 'fireplace')[];
}

export interface GasEquipmentInfo {
  furnaceType: 'standard' | 'high_efficiency' | 'none';
  furnaceAge: number;
  waterHeaterType: 'tank' | 'tankless' | 'none';
  waterHeaterAge: number;
  cookingAppliances: ('range' | 'oven' | 'cooktop' | 'grill')[];
  gasFireplace: boolean;
  outdoorGasAppliances: string[];
}

export interface GasPreferences {
  planType: 'fixed_rate' | 'variable_rate' | 'market_index' | 'any';
  contractLength: 'month_to_month' | '12_months' | '24_months' | '36_months' | 'no_preference';
  priorities: {
    lowestRate: number;
    priceStability: number;
    noContractFees: number;
    customerService: number;
  };
  budgetBilling: boolean;
}

export interface CurrentGasService {
  provider: string;
  planType: string;
  averageMonthlyBill: number;
  ratePerTherm: number;
  contractEndDate?: string;
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
}

// ============================================================================
// UTILITY INPUTS - WATER
// ============================================================================
export interface WaterUtilityInputs {
  property: UtilityPropertyInfo;
  usage: WaterUsageInfo;
  preferences: WaterPreferences;
  currentService?: CurrentWaterService;
}

export interface WaterUsageInfo {
  monthlyUsageGallons: number;
  irrigationUsage: boolean;
  irrigationSquareFootage?: number;
  irrigationType: 'sprinkler' | 'drip' | 'manual' | 'none';
  smartIrrigation: boolean;
  poolSize?: number;
  hotTub: boolean;
  
  // Water Efficiency
  lowFlowFixtures: boolean;
  highEfficiencyAppliances: boolean;
  rainwaterHarvesting: boolean;
  grayWaterSystem: boolean;
}

export interface WaterPreferences {
  priorities: {
    lowestRate: number;
    waterQuality: number;
    customerService: number;
    conservationPrograms: number;
  };
  conservationProgramInterest: boolean;
}

export interface CurrentWaterService {
  provider: string;
  averageMonthlyBill: number;
  rateStructure: 'flat' | 'tiered' | 'seasonal';
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
}

// ============================================================================
// INTERNET SERVICE INPUTS
// ============================================================================
export interface InternetServiceInputs {
  // Property Information
  property: {
    address: string;
    zipCode: string;
    propertyType: 'single_family' | 'multi_family' | 'condo' | 'apartment';
    homeOwnership: 'own' | 'rent';
    buildingMdu: boolean;
  };
  
  // Usage Profile
  usage: InternetUsageInfo;
  
  // Requirements
  requirements: InternetRequirements;
  
  // Preferences
  preferences: InternetPreferences;
  
  // Current Service
  currentService?: CurrentInternetService;
}

export interface InternetUsageInfo {
  householdMembers: number;
  simultaneousUsers: number;
  workFromHome: number;
  onlineStudents: number;
  
  // Usage Types
  usageTypes: {
    streaming4k: 'none' | 'occasional' | 'frequent' | 'constant';
    gaming: 'none' | 'casual' | 'competitive' | 'professional';
    videoConferencing: 'none' | 'occasional' | 'daily' | 'constant';
    largeFileTransfers: 'none' | 'occasional' | 'frequent' | 'constant';
    smartHome: 'none' | 'basic' | 'moderate' | 'extensive';
    securityCameras: number;
  };
  
  // Devices
  connectedDevices: {
    computers: number;
    smartphones: number;
    tablets: number;
    smartTVs: number;
    gamingConsoles: number;
    iotDevices: number;
    securityCameras: number;
  };
  
  // Monthly Data
  estimatedMonthlyDataGB: number;
}

export interface InternetRequirements {
  minimumDownloadMbps: number;
  minimumUploadMbps: number;
  latencyImportance: 'critical' | 'important' | 'moderate' | 'not_important';
  reliabilityImportance: 'critical' | 'important' | 'moderate' | 'not_important';
  
  // Connection Type
  preferredConnectionType: 'fiber' | 'cable' | 'dsl' | 'fixed_wireless' | 'satellite' | 'any';
  
  // Data Needs
  dataCap: 'unlimited_required' | 'unlimited_preferred' | 'acceptable';
  minimumDataCapGB?: number;
}

export interface InternetPreferences {
  contractLength: 'month_to_month' | '12_months' | '24_months' | 'no_preference';
  bundleOptions: ('tv' | 'phone' | 'mobile' | 'security')[];
  
  // Equipment
  equipmentPreference: 'rental' | 'own' | 'no_preference';
  wifiExtenders: boolean;
  meshNetwork: boolean;
  
  // Features
  features: {
    staticIp: boolean;
    noDataCap: boolean;
    freeModem: boolean;
    freeInstallation: boolean;
    priceGuarantee: boolean;
    wholehomeWifi: boolean;
    securitySuite: boolean;
    parentalControls: boolean;
  };
  
  // Budget
  maxMonthlyBudget: number;
  
  // Provider Preferences
  providerPreferences: {
    majorProviderOnly: boolean;
    localProviderPreferred: boolean;
    avoidProviders: string[];
  };
}

export interface CurrentInternetService {
  provider: string;
  planName: string;
  downloadSpeed: number;
  uploadSpeed: number;
  monthlyPrice: number;
  dataCap?: number;
  contractEndDate?: string;
  bundledServices: string[];
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
  reasonForChange: string[];
}

// ============================================================================
// MOBILE PHONE SERVICE INPUTS
// ============================================================================
export interface MobileServiceInputs {
  // Lines
  lines: MobileLineInfo[];
  
  // Usage
  usage: MobileUsageInfo;
  
  // Requirements
  requirements: MobileRequirements;
  
  // Preferences
  preferences: MobilePreferences;
  
  // Current Service
  currentService?: CurrentMobileService;
}

export interface MobileLineInfo {
  userType: 'adult' | 'teen' | 'child' | 'senior';
  age?: number;
  deviceType: 'smartphone' | 'basic_phone' | 'tablet' | 'smartwatch' | 'hotspot';
  currentDevice?: string;
  needNewDevice: boolean;
  devicePreference?: string;
  upgradeImportance: 'critical' | 'important' | 'not_important';
}

export interface MobileUsageInfo {
  dataUsageGB: {
    total: number;
    perLine: number[];
  };
  callMinutes: {
    domestic: number;
    international: number;
  };
  textMessages: number;
  
  // Usage Patterns
  hotspotUsage: boolean;
  hotspotUsageGB?: number;
  streamingOnMobile: 'none' | 'occasional' | 'frequent' | 'constant';
  internationalTravel: 'never' | 'rarely' | 'occasionally' | 'frequently';
  travelDestinations?: string[];
}

export interface MobileRequirements {
  networkCoverage: {
    homeZip: string;
    workZip?: string;
    frequentAreas: string[];
    ruralCoverage: boolean;
  };
  
  networkPriority: '5g_essential' | '5g_preferred' | '4g_acceptable' | 'no_preference';
  dataNeeds: 'unlimited_required' | 'unlimited_preferred' | 'limited_acceptable';
  familyPlan: boolean;
  numberOfLines: number;
}

export interface MobilePreferences {
  carrierType: 'major' | 'mvno' | 'prepaid' | 'any';
  contractType: 'postpaid' | 'prepaid' | 'no_preference';
  
  // Features
  features: {
    hotspot: boolean;
    internationalRoaming: boolean;
    streamingPerks: boolean;
    insuranceProtection: boolean;
    premiumData: boolean;
    canadaMexicoIncluded: boolean;
    wifiCalling: boolean;
    numberPorting: boolean;
  };
  
  // Device Preferences
  devicePayment: 'upfront' | 'installment' | 'lease' | 'no_preference';
  tradeInDevices: boolean;
  
  // Budget
  maxMonthlyBudget: number;
  perLineMaxBudget?: number;
  
  // Provider Preferences
  avoidCarriers: string[];
}

export interface CurrentMobileService {
  carrier: string;
  planName: string;
  numberOfLines: number;
  monthlyPrice: number;
  dataLimit?: number;
  contractEndDate?: string;
  devicesOwed?: number;
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
  reasonForChange: string[];
}

// ============================================================================
// FINANCIAL SERVICES - LOANS
// ============================================================================
export interface LoanServiceInputs {
  // Loan Type
  loanType: 'personal' | 'auto' | 'home_equity' | 'debt_consolidation' | 'home_improvement';
  
  // Loan Details
  details: LoanDetails;
  
  // Borrower Information
  borrower: BorrowerInfo;
  
  // Preferences
  preferences: LoanPreferences;
  
  // Current Debt
  currentDebt?: CurrentDebtInfo[];
}

export interface LoanDetails {
  requestedAmount: number;
  loanPurpose: string;
  preferredTerm: 12 | 24 | 36 | 48 | 60 | 72 | 84;
  collateral?: {
    type: 'vehicle' | 'home_equity' | 'savings' | 'none';
    value?: number;
  };
}

export interface BorrowerInfo {
  annualIncome: number;
  employmentStatus: 'employed' | 'self_employed' | 'retired' | 'unemployed' | 'student';
  employmentLength: number;
  employer?: string;
  monthlyHousingPayment: number;
  homeOwnership: 'own_with_mortgage' | 'own_free_clear' | 'rent' | 'other';
  
  // Credit Profile
  creditScore: number;
  creditHistory: 'excellent' | 'good' | 'fair' | 'poor';
  bankruptcyHistory: boolean;
  bankruptcyYearsAgo?: number;
  
  // Co-borrower
  coBorrower?: {
    annualIncome: number;
    creditScore: number;
    employmentStatus: string;
  };
}

export interface LoanPreferences {
  maxApr: number;
  preferredPayment: number;
  prepaymentPenalty: 'acceptable' | 'not_acceptable';
  originationFee: 'acceptable' | 'prefer_none';
  directDeposit: boolean;
  autopay: boolean;
  
  // Lender Preferences
  lenderType: 'bank' | 'credit_union' | 'online' | 'any';
  existingRelationship: string[];
}

export interface CurrentDebtInfo {
  type: 'credit_card' | 'personal_loan' | 'auto_loan' | 'student_loan' | 'mortgage' | 'other';
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  remainingTerm?: number;
}

// ============================================================================
// FINANCIAL SERVICES - CREDIT CARDS
// ============================================================================
export interface CreditCardInputs {
  // Applicant Information
  applicant: CreditCardApplicantInfo;
  
  // Spending Profile
  spending: SpendingProfile;
  
  // Preferences
  preferences: CreditCardPreferences;
  
  // Current Cards
  currentCards?: CurrentCreditCard[];
}

export interface CreditCardApplicantInfo {
  creditScore: number;
  creditHistory: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  annualIncome: number;
  monthlyRent: number;
  bankingRelationships: string[];
  existingCardHolder: boolean;
}

export interface SpendingProfile {
  monthlySpending: {
    groceries: number;
    dining: number;
    gas: number;
    travel: number;
    onlineShopping: number;
    utilities: number;
    entertainment: number;
    other: number;
  };
  
  largestCategories: string[];
  balanceCarry: 'never' | 'sometimes' | 'usually' | 'always';
  averageBalanceCarried: number;
  
  // Travel Profile
  travelFrequency: 'none' | 'occasional' | 'frequent' | 'very_frequent';
  internationalTravel: boolean;
  preferredAirlines: string[];
  preferredHotels: string[];
}

export interface CreditCardPreferences {
  cardType: 'cash_back' | 'travel_rewards' | 'balance_transfer' | 'business' | 'secured' | 'student' | 'any';
  
  // Rewards Preferences
  rewardsPreference: 'cash_back' | 'points' | 'miles' | 'no_preference';
  rewardsPriority: {
    highRewardsRate: number;
    signUpBonus: number;
    flexibleRedemption: number;
    noExpiration: number;
    transferPartners: number;
  };
  
  // Fee Tolerance
  annualFeeMax: number;
  foreignTransactionFee: 'acceptable' | 'not_acceptable';
  balanceTransferFee: 'acceptable' | 'prefer_low';
  
  // Features
  features: {
    introApr: boolean;
    balanceTransferOffer: boolean;
    purchaseProtection: boolean;
    extendedWarranty: boolean;
    travelInsurance: boolean;
    loungeAccess: boolean;
    tsa_precheck_credit: boolean;
    cellPhoneProtection: boolean;
    noForeignTransactionFee: boolean;
  };
  
  // Card Type
  networkPreference: 'visa' | 'mastercard' | 'amex' | 'discover' | 'any';
  metalCard: boolean;
}

export interface CurrentCreditCard {
  issuer: string;
  cardName: string;
  creditLimit: number;
  currentBalance: number;
  annualFee: number;
  interestRate: number;
  rewardsType: string;
  yearsHeld: number;
}

// ============================================================================
// MASTER INPUT TYPE
// ============================================================================
export interface ServiceComparisonInputs {
  serviceType: ServiceType;
  location: LocationInfo;
  
  // Service-specific inputs
  autoInsurance?: AutoInsuranceInputs;
  homeInsurance?: HomeInsuranceInputs;
  healthInsurance?: HealthInsuranceInputs;
  lifeInsurance?: LifeInsuranceInputs;
  petInsurance?: PetInsuranceInputs;
  electricUtility?: ElectricUtilityInputs;
  gasUtility?: GasUtilityInputs;
  waterUtility?: WaterUtilityInputs;
  internetService?: InternetServiceInputs;
  mobileService?: MobileServiceInputs;
  loanService?: LoanServiceInputs;
  creditCard?: CreditCardInputs;
}

export interface LocationInfo {
  address?: string;
  city?: string;
  state: string;
  zipCode: string;
  county?: string;
}

export type ServiceType =
  | 'auto_insurance'
  | 'home_insurance'
  | 'health_insurance'
  | 'life_insurance'
  | 'pet_insurance'
  | 'electric_utility'
  | 'gas_utility'
  | 'water_utility'
  | 'internet_service'
  | 'mobile_service'
  | 'personal_loan'
  | 'credit_card';

export const SERVICE_TYPE_CONFIG: Record<ServiceType, {
  label: string;
  icon: string;
  category: 'insurance' | 'utility' | 'telecom' | 'financial';
  description: string;
}> = {
  auto_insurance: {
    label: 'Auto Insurance',
    icon: 'Car',
    category: 'insurance',
    description: 'Compare car insurance rates and coverage options'
  },
  home_insurance: {
    label: 'Home Insurance',
    icon: 'Home',
    category: 'insurance',
    description: 'Find the best homeowners or renters insurance'
  },
  health_insurance: {
    label: 'Health Insurance',
    icon: 'Heart',
    category: 'insurance',
    description: 'Compare health plans and coverage'
  },
  life_insurance: {
    label: 'Life Insurance',
    icon: 'Shield',
    category: 'insurance',
    description: 'Find term or whole life coverage'
  },
  pet_insurance: {
    label: 'Pet Insurance',
    icon: 'PawPrint',
    category: 'insurance',
    description: 'Protect your pets with the right coverage'
  },
  electric_utility: {
    label: 'Electric Utility',
    icon: 'Zap',
    category: 'utility',
    description: 'Compare electricity providers and rates'
  },
  gas_utility: {
    label: 'Gas Utility',
    icon: 'Flame',
    category: 'utility',
    description: 'Find the best natural gas rates'
  },
  water_utility: {
    label: 'Water Utility',
    icon: 'Droplets',
    category: 'utility',
    description: 'Compare water service options'
  },
  internet_service: {
    label: 'Internet Service',
    icon: 'Wifi',
    category: 'telecom',
    description: 'Find the fastest internet for your needs'
  },
  mobile_service: {
    label: 'Mobile Phone',
    icon: 'Smartphone',
    category: 'telecom',
    description: 'Compare cell phone plans and carriers'
  },
  personal_loan: {
    label: 'Personal Loan',
    icon: 'DollarSign',
    category: 'financial',
    description: 'Find the best loan rates'
  },
  credit_card: {
    label: 'Credit Card',
    icon: 'CreditCard',
    category: 'financial',
    description: 'Compare rewards and benefits'
  }
};


















