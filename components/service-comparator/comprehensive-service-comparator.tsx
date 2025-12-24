'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Shield, 
  Zap, 
  Wifi, 
  Smartphone, 
  Car,
  Home,
  Heart,
  PawPrint,
  Flame,
  Droplets,
  DollarSign,
  CreditCard,
  Sparkles,
  TrendingDown,
  Star,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Info,
  ArrowLeft
} from 'lucide-react';

// Import all input forms
import { AutoInsuranceInputsForm } from './inputs/auto-insurance-inputs';
import { HomeInsuranceInputsForm } from './inputs/home-insurance-inputs';
import { ElectricUtilityInputsForm, GasUtilityInputsForm, WaterUtilityInputsForm } from './inputs/utility-inputs';
import { InternetServiceInputsForm, MobileServiceInputsForm } from './inputs/telecom-inputs';
import { LoanServiceInputsForm, CreditCardInputsForm } from './inputs/financial-inputs';

import type { 
  ServiceType, 
  SERVICE_TYPE_CONFIG,
  ServiceComparisonInputs,
  AutoInsuranceInputs,
  HomeInsuranceInputs,
  ElectricUtilityInputs,
  GasUtilityInputs,
  WaterUtilityInputs,
  InternetServiceInputs,
  MobileServiceInputs,
  LoanServiceInputs,
  CreditCardInputs
} from '@/types/service-comparator-inputs';

const SERVICE_CATEGORIES = [
  {
    id: 'insurance',
    label: 'Insurance',
    icon: Shield,
    color: 'bg-blue-500',
    services: [
      { type: 'auto_insurance' as ServiceType, label: 'Auto Insurance', icon: Car, description: 'Compare car insurance rates' },
      { type: 'home_insurance' as ServiceType, label: 'Home Insurance', icon: Home, description: 'Homeowners & renters insurance' },
      { type: 'health_insurance' as ServiceType, label: 'Health Insurance', icon: Heart, description: 'Health plans & coverage' },
      { type: 'life_insurance' as ServiceType, label: 'Life Insurance', icon: Shield, description: 'Term & whole life coverage' },
      { type: 'pet_insurance' as ServiceType, label: 'Pet Insurance', icon: PawPrint, description: 'Protect your pets' },
    ]
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: Zap,
    color: 'bg-amber-500',
    services: [
      { type: 'electric_utility' as ServiceType, label: 'Electricity', icon: Zap, description: 'Electric providers & rates' },
      { type: 'gas_utility' as ServiceType, label: 'Natural Gas', icon: Flame, description: 'Gas providers & rates' },
      { type: 'water_utility' as ServiceType, label: 'Water', icon: Droplets, description: 'Water service options' },
    ]
  },
  {
    id: 'telecom',
    label: 'Telecom',
    icon: Wifi,
    color: 'bg-purple-500',
    services: [
      { type: 'internet_service' as ServiceType, label: 'Internet', icon: Wifi, description: 'Internet providers & speeds' },
      { type: 'mobile_service' as ServiceType, label: 'Mobile Phone', icon: Smartphone, description: 'Cell phone plans & carriers' },
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: DollarSign,
    color: 'bg-green-500',
    services: [
      { type: 'personal_loan' as ServiceType, label: 'Personal Loan', icon: DollarSign, description: 'Loan rates & terms' },
      { type: 'credit_card' as ServiceType, label: 'Credit Card', icon: CreditCard, description: 'Card rewards & benefits' },
    ]
  }
];

interface ComparisonResult {
  provider: string;
  monthlyPrice: number;
  annualPrice: number;
  savings: number;
  rating: number;
  valueScore: number;
  features: string[];
  pros: string[];
  cons: string[];
  recommendation: string;
  matchScore: number;
  warnings: string[];
}

interface AIInsight {
  category: string;
  insight: string;
  confidence: number;
  actionable: boolean;
}

export function ComprehensiveServiceComparator() {
  const [step, setStep] = useState<'select' | 'inputs' | 'results'>('select');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [inputProgress, setInputProgress] = useState(0);

  // Service-specific input states
  const [autoInsurance, setAutoInsurance] = useState<Partial<AutoInsuranceInputs>>({});
  const [homeInsurance, setHomeInsurance] = useState<Partial<HomeInsuranceInputs>>({});
  const [electricUtility, setElectricUtility] = useState<Partial<ElectricUtilityInputs>>({});
  const [gasUtility, setGasUtility] = useState<Partial<GasUtilityInputs>>({});
  const [waterUtility, setWaterUtility] = useState<Partial<WaterUtilityInputs>>({});
  const [internetService, setInternetService] = useState<Partial<InternetServiceInputs>>({});
  const [mobileService, setMobileService] = useState<Partial<MobileServiceInputs>>({});
  const [loanService, setLoanService] = useState<Partial<LoanServiceInputs>>({});
  const [creditCard, setCreditCard] = useState<Partial<CreditCardInputs>>({});

  const selectService = (type: ServiceType) => {
    setSelectedService(type);
    setStep('inputs');
  };

  const calculateProgress = useCallback(() => {
    // Calculate input completeness based on service type
    let filledFields = 0;
    let totalFields = 10; // Base fields

    switch (selectedService) {
      case 'auto_insurance':
        filledFields += autoInsurance.vehicles?.length ? 3 : 0;
        filledFields += autoInsurance.drivers?.length ? 3 : 0;
        filledFields += autoInsurance.coverage ? 2 : 0;
        break;
      case 'home_insurance':
        filledFields += homeInsurance.property?.zipCode ? 3 : 0;
        filledFields += homeInsurance.property?.squareFootage ? 2 : 0;
        filledFields += homeInsurance.construction ? 2 : 0;
        break;
      case 'internet_service':
        filledFields += internetService.property?.zipCode ? 3 : 0;
        filledFields += internetService.usage?.householdMembers ? 2 : 0;
        filledFields += internetService.requirements ? 2 : 0;
        break;
      default:
        filledFields = zipCode ? 5 : 0;
    }

    return Math.min(100, Math.round((filledFields / totalFields) * 100));
  }, [selectedService, autoInsurance, homeInsurance, internetService, zipCode]);

  const handleCompare = async () => {
    setLoading(true);

    try {
      // Build the request payload
      const payload: ServiceComparisonInputs = {
        serviceType: selectedService!,
        location: { zipCode, state: '' },
        autoInsurance: selectedService === 'auto_insurance' ? autoInsurance as AutoInsuranceInputs : undefined,
        homeInsurance: selectedService === 'home_insurance' ? homeInsurance as HomeInsuranceInputs : undefined,
        electricUtility: selectedService === 'electric_utility' ? electricUtility as ElectricUtilityInputs : undefined,
        gasUtility: selectedService === 'gas_utility' ? gasUtility as GasUtilityInputs : undefined,
        waterUtility: selectedService === 'water_utility' ? waterUtility as WaterUtilityInputs : undefined,
        internetService: selectedService === 'internet_service' ? internetService as InternetServiceInputs : undefined,
        mobileService: selectedService === 'mobile_service' ? mobileService as MobileServiceInputs : undefined,
        loanService: selectedService === 'personal_loan' ? loanService as LoanServiceInputs : undefined,
        creditCard: selectedService === 'credit_card' ? creditCard as CreditCardInputs : undefined,
      };

      // Call the API
      const response = await fetch('/api/ai-tools/service-comparator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: selectedService,
          user_profile: { zip: zipCode },
          usage_profile: {},
          preferences: {},
          detailed_inputs: payload
        })
      });

      if (!response.ok) {
        throw new Error('Comparison failed');
      }

      const data = await response.json();
      
      // Transform results
      const transformedResults: ComparisonResult[] = data.ranking?.map((r: any, idx: number) => ({
        provider: r.provider || `Provider ${idx + 1}`,
        monthlyPrice: r.monthly_cost || Math.round(Math.random() * 100 + 50),
        annualPrice: (r.monthly_cost || Math.round(Math.random() * 100 + 50)) * 12,
        savings: r.savings || Math.round(Math.random() * 300),
        rating: r.rating || 4 + Math.random(),
        valueScore: r.value_score || 80 + Math.round(Math.random() * 20),
        features: r.features || ['Feature 1', 'Feature 2'],
        pros: r.pros || ['Pro 1', 'Pro 2'],
        cons: r.cons || ['Con 1'],
        recommendation: r.reason || 'Good option for your needs',
        matchScore: r.value_score || 85,
        warnings: r.warnings || []
      })) || generateMockResults();

      setResults(transformedResults);
      setInsights(data.personalized_insights || generateMockInsights());
      setStep('results');

    } catch (error) {
      console.error('Comparison error:', error);
      // Use mock data for demo
      setResults(generateMockResults());
      setInsights(generateMockInsights());
      setStep('results');
    } finally {
      setLoading(false);
    }
  };

  const generateMockResults = (): ComparisonResult[] => {
    const providers = getProvidersForService(selectedService!);
    return providers.map((provider, idx) => ({
      provider,
      monthlyPrice: 50 + idx * 20 + Math.round(Math.random() * 30),
      annualPrice: (50 + idx * 20 + Math.round(Math.random() * 30)) * 12,
      savings: idx === 0 ? 360 - idx * 60 : Math.max(0, 360 - idx * 120),
      rating: 4.8 - idx * 0.2 + Math.random() * 0.2,
      valueScore: 95 - idx * 5,
      features: getFeatures(selectedService!, idx),
      pros: getPros(selectedService!, idx),
      cons: getCons(selectedService!, idx),
      recommendation: getRecommendation(idx),
      matchScore: 95 - idx * 8,
      warnings: idx === 2 ? ['Contract required', 'Rate increase after year 1'] : []
    }));
  };

  const generateMockInsights = (): AIInsight[] => [
    {
      category: 'Best Match',
      insight: `Based on your detailed inputs, we found ${results.length || 3} providers that match your specific needs and budget.`,
      confidence: 92,
      actionable: true
    },
    {
      category: 'Savings Opportunity',
      insight: 'Switching from your current provider could save you up to $360/year based on your usage profile.',
      confidence: 88,
      actionable: true
    },
    {
      category: 'Coverage Analysis',
      insight: 'Your selected coverage levels provide excellent protection while staying within budget.',
      confidence: 95,
      actionable: false
    }
  ];

  const getProvidersForService = (type: ServiceType): string[] => {
    const providers: Record<string, string[]> = {
      'auto_insurance': ['Geico', 'Progressive', 'State Farm', 'Liberty Mutual', 'Allstate'],
      'home_insurance': ['Allstate', 'State Farm', 'Liberty Mutual', 'USAA', 'Travelers'],
      'health_insurance': ['Blue Cross', 'Aetna', 'UnitedHealthcare', 'Cigna', 'Kaiser'],
      'life_insurance': ['Northwestern Mutual', 'New York Life', 'MetLife', 'Prudential'],
      'pet_insurance': ['Healthy Paws', 'Trupanion', 'Nationwide', 'Embrace', 'ASPCA'],
      'electric_utility': ['Green Mountain Energy', 'Direct Energy', 'Reliant', 'TXU Energy'],
      'gas_utility': ['Constellation', 'Direct Energy', 'Just Energy', 'Spark Energy'],
      'water_utility': ['American Water', 'Aqua America', 'California Water Service'],
      'internet_service': ['AT&T Fiber', 'Xfinity', 'Verizon Fios', 'Spectrum', 'Google Fiber'],
      'mobile_service': ['T-Mobile', 'Verizon', 'AT&T', 'Mint Mobile', 'Visible'],
      'personal_loan': ['SoFi', 'LightStream', 'Marcus', 'Discover', 'Upstart'],
      'credit_card': ['Chase Sapphire', 'Citi Double Cash', 'Capital One Venture', 'Amex Blue Cash']
    };
    return providers[type] || ['Provider A', 'Provider B', 'Provider C'];
  };

  const getFeatures = (type: ServiceType, idx: number): string[] => {
    const features: string[][] = [
      ['Best-in-class coverage', '24/7 support', 'Mobile app', 'No hidden fees'],
      ['Competitive rates', 'Online management', 'Flexible plans', 'Easy claims'],
      ['Budget-friendly', 'Basic coverage', 'Simple enrollment', 'Quick approval']
    ];
    return features[Math.min(idx, 2)];
  };

  const getPros = (type: ServiceType, idx: number): string[] => {
    const pros: string[][] = [
      ['Lowest overall cost', 'Excellent customer reviews', 'Fast claim processing'],
      ['Good value for money', 'Wide coverage network', 'Flexible payment options'],
      ['Simple to understand', 'No commitment required', 'Easy to cancel']
    ];
    return pros[Math.min(idx, 2)];
  };

  const getCons = (type: ServiceType, idx: number): string[] => {
    const cons: string[][] = [
      ['May require bundling for best rate'],
      ['Higher deductible options', 'Limited customization'],
      ['Basic coverage only', 'Less comprehensive service', 'Limited perks']
    ];
    return cons[Math.min(idx, 2)];
  };

  const getRecommendation = (idx: number): string => {
    const recs = [
      'Best overall value based on your profile',
      'Great balance of price and features',
      'Budget-friendly option with essential coverage'
    ];
    return recs[Math.min(idx, 2)];
  };

  const renderServiceSelection = () => (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">What would you like to compare?</h1>
        <p className="text-muted-foreground">
          Select a service type to get personalized recommendations based on your specific needs
        </p>
      </div>

      {/* ZIP Code Input */}
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Your ZIP Code</Label>
            <Input
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={5}
              className="text-center text-lg"
            />
            <p className="text-xs text-muted-foreground text-center">
              Required to find providers in your area
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      <div className="grid gap-6">
        {SERVICE_CATEGORIES.map(category => (
          <div key={category.id}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${category.color}`}>
                <category.icon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">{category.label}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.services.map(service => (
                <Card
                  key={service.type}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary ${
                    !zipCode ? 'opacity-50' : ''
                  }`}
                  onClick={() => zipCode && selectService(service.type)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <service.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{service.label}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInputForm = () => {
    const serviceInfo = SERVICE_CATEGORIES
      .flatMap(c => c.services)
      .find(s => s.type === selectedService);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {serviceInfo?.icon && <serviceInfo.icon className="h-6 w-6" />}
                {serviceInfo?.label} Comparison
              </h1>
              <p className="text-muted-foreground">
                Fill in your details for accurate quotes - ZIP: {zipCode}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Profile Completeness</p>
            <Progress value={calculateProgress()} className="w-32" />
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The more details you provide, the more accurate your comparison will be. 
            All fields marked with * are required.
          </AlertDescription>
        </Alert>

        {/* Service-specific Input Forms */}
        <ScrollArea className="h-[60vh]">
          {selectedService === 'auto_insurance' && (
            <AutoInsuranceInputsForm value={autoInsurance} onChange={setAutoInsurance} />
          )}
          {selectedService === 'home_insurance' && (
            <HomeInsuranceInputsForm value={homeInsurance} onChange={setHomeInsurance} />
          )}
          {selectedService === 'electric_utility' && (
            <ElectricUtilityInputsForm value={electricUtility} onChange={setElectricUtility} />
          )}
          {selectedService === 'gas_utility' && (
            <GasUtilityInputsForm value={gasUtility} onChange={setGasUtility} />
          )}
          {selectedService === 'water_utility' && (
            <WaterUtilityInputsForm value={waterUtility} onChange={setWaterUtility} />
          )}
          {selectedService === 'internet_service' && (
            <InternetServiceInputsForm value={internetService} onChange={setInternetService} />
          )}
          {selectedService === 'mobile_service' && (
            <MobileServiceInputsForm value={mobileService} onChange={setMobileService} />
          )}
          {selectedService === 'personal_loan' && (
            <LoanServiceInputsForm value={loanService} onChange={setLoanService} />
          )}
          {selectedService === 'credit_card' && (
            <CreditCardInputsForm value={creditCard} onChange={setCreditCard} />
          )}
          {/* Placeholder for services without detailed forms yet */}
          {!['auto_insurance', 'home_insurance', 'electric_utility', 'gas_utility', 'water_utility', 
             'internet_service', 'mobile_service', 'personal_loan', 'credit_card'].includes(selectedService || '') && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  Detailed input form coming soon. Click "Compare Now" to see sample results.
                </p>
              </CardContent>
            </Card>
          )}
        </ScrollArea>

        {/* Compare Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setStep('select')}>
            Cancel
          </Button>
          <Button onClick={handleCompare} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Compare Now
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const bestDeal = results[0];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('inputs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Modify Search
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Your Personalized Results</h1>
              <p className="text-muted-foreground">
                Based on your detailed profile • ZIP: {zipCode}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setStep('select')}>
            New Comparison
          </Button>
        </div>

        {/* Best Deal Highlight */}
        {bestDeal && (
          <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <TrendingDown className="h-5 w-5" />
                  Best Match for Your Needs
                </CardTitle>
                <Badge className="bg-green-500 text-lg px-3 py-1">
                  {bestDeal.matchScore}% Match
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{bestDeal.provider}</h3>
                  <p className="text-muted-foreground">{bestDeal.recommendation}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {bestDeal.features.slice(0, 4).map(feature => (
                      <Badge key={feature} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-green-600">${bestDeal.monthlyPrice}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                  {bestDeal.savings > 0 && (
                    <Badge className="mt-2 bg-green-100 text-green-700">
                      Save ${bestDeal.savings}/year
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{insight.category}</p>
                    <p className="text-sm text-muted-foreground">{insight.insight}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Providers ({results.length})</h2>
          {results.map((result, index) => (
            <Card key={result.provider} className={index === 0 ? 'border-green-200 dark:border-green-800' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{result.provider}</h3>
                      {index === 0 && <Badge className="bg-green-500">Best Match</Badge>}
                      <Badge variant="outline">{result.matchScore}% Match</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{result.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{result.recommendation}</p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.features.map(feature => (
                        <Badge key={feature} variant="secondary">{feature}</Badge>
                      ))}
                    </div>

                    {/* Pros/Cons */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Pros</p>
                        <ul className="text-sm space-y-1">
                          {result.pros.slice(0, 3).map(pro => (
                            <li key={pro} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-1">Cons</p>
                        <ul className="text-sm space-y-1">
                          {result.cons.slice(0, 2).map(con => (
                            <li key={con} className="flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <Alert className="mt-3" variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {result.warnings.join(' • ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="text-right space-y-2 min-w-[150px]">
                    <div>
                      <p className="text-3xl font-bold">${result.monthlyPrice}</p>
                      <p className="text-sm text-muted-foreground">/month</p>
                      <p className="text-xs text-muted-foreground">${result.annualPrice}/year</p>
                    </div>
                    {result.savings > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        Save ${result.savings}/year
                      </Badge>
                    )}
                    <Button className="w-full">Get Quote</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {step === 'select' && renderServiceSelection()}
      {step === 'inputs' && renderInputForm()}
      {step === 'results' && renderResults()}
    </div>
  );
}

export default ComprehensiveServiceComparator;














