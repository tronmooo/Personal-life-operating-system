'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  DollarSign, 
  CreditCard,
  User,
  Briefcase,
  TrendingUp,
  ShoppingCart,
  Plane,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2
} from 'lucide-react';
import type { LoanServiceInputs, CreditCardInputs, CurrentDebtInfo } from '@/types/service-comparator-inputs';

// ============================================================================
// LOAN SERVICE INPUTS
// ============================================================================

interface LoanServiceInputsFormProps {
  value: Partial<LoanServiceInputs>;
  onChange: (value: Partial<LoanServiceInputs>) => void;
}

export function LoanServiceInputsForm({ value, onChange }: LoanServiceInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    borrower: true,
    preferences: false,
    debt: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const details = value.details || {
    requestedAmount: 0,
    loanPurpose: '',
    preferredTerm: 36
  };
  const borrower = value.borrower || {
    annualIncome: 0,
    employmentStatus: 'employed',
    employmentLength: 0,
    monthlyHousingPayment: 0,
    homeOwnership: 'rent',
    creditScore: 700,
    creditHistory: 'good',
    bankruptcyHistory: false
  };
  const preferences = value.preferences || {
    maxApr: 20,
    preferredPayment: 0,
    prepaymentPenalty: 'not_acceptable',
    originationFee: 'prefer_none',
    directDeposit: true,
    autopay: true,
    lenderType: 'any',
    existingRelationship: []
  };
  const currentDebt = value.currentDebt || [];

  const addDebt = () => {
    const newDebt: CurrentDebtInfo = {
      type: 'credit_card',
      balance: 0,
      monthlyPayment: 0,
      interestRate: 0
    };
    onChange({ ...value, currentDebt: [...currentDebt, newDebt] });
  };

  const updateDebt = (index: number, updates: Partial<CurrentDebtInfo>) => {
    const newDebt = [...currentDebt];
    newDebt[index] = { ...newDebt[index], ...updates };
    onChange({ ...value, currentDebt: newDebt });
  };

  const removeDebt = (index: number) => {
    onChange({ ...value, currentDebt: currentDebt.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Loan Details */}
      <Collapsible open={expandedSections.details} onOpenChange={() => toggleSection('details')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Loan Details</CardTitle>
                    <CardDescription>How much do you need and for what?</CardDescription>
                  </div>
                </div>
                {expandedSections.details ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Loan Type</Label>
                  <Select
                    value={value.loanType || 'personal'}
                    onValueChange={(v: typeof value.loanType) => onChange({ ...value, loanType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Loan</SelectItem>
                      <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                      <SelectItem value="home_improvement">Home Improvement</SelectItem>
                      <SelectItem value="auto">Auto Refinance</SelectItem>
                      <SelectItem value="home_equity">Home Equity Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loan Amount *</Label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={details.requestedAmount || ''}
                    onChange={(e) => onChange({ ...value, details: { ...details, requestedAmount: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Term</Label>
                  <Select
                    value={details.preferredTerm?.toString() || '36'}
                    onValueChange={(v) => onChange({ ...value, details: { ...details, preferredTerm: parseInt(v) as typeof details.preferredTerm } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 months (1 year)</SelectItem>
                      <SelectItem value="24">24 months (2 years)</SelectItem>
                      <SelectItem value="36">36 months (3 years)</SelectItem>
                      <SelectItem value="48">48 months (4 years)</SelectItem>
                      <SelectItem value="60">60 months (5 years)</SelectItem>
                      <SelectItem value="72">72 months (6 years)</SelectItem>
                      <SelectItem value="84">84 months (7 years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Loan Purpose</Label>
                <Input
                  placeholder="e.g., Consolidate credit card debt, home renovation, medical expenses"
                  value={details.loanPurpose || ''}
                  onChange={(e) => onChange({ ...value, details: { ...details, loanPurpose: e.target.value } })}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Borrower Information */}
      <Collapsible open={expandedSections.borrower} onOpenChange={() => toggleSection('borrower')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Borrower Information</CardTitle>
                    <CardDescription>Your financial profile</CardDescription>
                  </div>
                </div>
                {expandedSections.borrower ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Income & Employment */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Income & Employment
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Annual Income *</Label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={borrower.annualIncome || ''}
                      onChange={(e) => onChange({ ...value, borrower: { ...borrower, annualIncome: parseInt(e.target.value) || 0 } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Status</Label>
                    <Select
                      value={borrower.employmentStatus || 'employed'}
                      onValueChange={(v: typeof borrower.employmentStatus) => 
                        onChange({ ...value, borrower: { ...borrower, employmentStatus: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self_employed">Self-Employed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Years at Job</Label>
                    <Select
                      value={borrower.employmentLength?.toString() || '0'}
                      onValueChange={(v) => onChange({ ...value, borrower: { ...borrower, employmentLength: parseInt(v) } })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Less than 1 year</SelectItem>
                        <SelectItem value="1">1 year</SelectItem>
                        <SelectItem value="2">2 years</SelectItem>
                        <SelectItem value="3">3-5 years</SelectItem>
                        <SelectItem value="6">5-10 years</SelectItem>
                        <SelectItem value="10">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Housing</Label>
                    <Input
                      type="number"
                      placeholder="$ rent/mortgage"
                      value={borrower.monthlyHousingPayment || ''}
                      onChange={(e) => onChange({ ...value, borrower: { ...borrower, monthlyHousingPayment: parseInt(e.target.value) || 0 } })}
                    />
                  </div>
                </div>
              </div>

              {/* Credit Profile */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Credit Profile
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Credit Score *</Label>
                    <Input
                      type="number"
                      placeholder="300-850"
                      min={300}
                      max={850}
                      value={borrower.creditScore || ''}
                      onChange={(e) => onChange({ ...value, borrower: { ...borrower, creditScore: parseInt(e.target.value) || 0 } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credit History</Label>
                    <Select
                      value={borrower.creditHistory || 'good'}
                      onValueChange={(v: typeof borrower.creditHistory) => 
                        onChange({ ...value, borrower: { ...borrower, creditHistory: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent (750+)</SelectItem>
                        <SelectItem value="good">Good (700-749)</SelectItem>
                        <SelectItem value="fair">Fair (650-699)</SelectItem>
                        <SelectItem value="poor">Poor (below 650)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Home Ownership</Label>
                    <Select
                      value={borrower.homeOwnership || 'rent'}
                      onValueChange={(v: typeof borrower.homeOwnership) => 
                        onChange({ ...value, borrower: { ...borrower, homeOwnership: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="own_with_mortgage">Own (with mortgage)</SelectItem>
                        <SelectItem value="own_free_clear">Own (no mortgage)</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <Checkbox
                      id="bankruptcy"
                      checked={borrower.bankruptcyHistory || false}
                      onCheckedChange={(checked) => onChange({ ...value, borrower: { ...borrower, bankruptcyHistory: checked as boolean } })}
                    />
                    <Label htmlFor="bankruptcy">Prior Bankruptcy</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Preferences */}
      <Collapsible open={expandedSections.preferences} onOpenChange={() => toggleSection('preferences')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Loan Preferences</CardTitle>
                    <CardDescription>Rate and term preferences</CardDescription>
                  </div>
                </div>
                {expandedSections.preferences ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Max APR Acceptable</Label>
                  <Select
                    value={preferences.maxApr?.toString() || '20'}
                    onValueChange={(v) => onChange({ ...value, preferences: { ...preferences, maxApr: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Under 10%</SelectItem>
                      <SelectItem value="15">Under 15%</SelectItem>
                      <SelectItem value="20">Under 20%</SelectItem>
                      <SelectItem value="25">Under 25%</SelectItem>
                      <SelectItem value="36">Any Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Monthly Payment</Label>
                  <Input
                    type="number"
                    placeholder="$ (optional)"
                    value={preferences.preferredPayment || ''}
                    onChange={(e) => onChange({ ...value, preferences: { ...preferences, preferredPayment: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lender Type</Label>
                  <Select
                    value={preferences.lenderType || 'any'}
                    onValueChange={(v: typeof preferences.lenderType) => 
                      onChange({ ...value, preferences: { ...preferences, lenderType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="credit_union">Credit Union</SelectItem>
                      <SelectItem value="online">Online Lender</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Origination Fee</Label>
                  <Select
                    value={preferences.originationFee || 'prefer_none'}
                    onValueChange={(v: typeof preferences.originationFee) => 
                      onChange({ ...value, preferences: { ...preferences, originationFee: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefer_none">Prefer No Fee</SelectItem>
                      <SelectItem value="acceptable">Fee Acceptable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autopay"
                    checked={preferences.autopay || false}
                    onCheckedChange={(checked) => onChange({ ...value, preferences: { ...preferences, autopay: checked as boolean } })}
                  />
                  <Label htmlFor="autopay">Will use Autopay (often saves 0.25%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="direct-deposit"
                    checked={preferences.directDeposit || false}
                    onCheckedChange={(checked) => onChange({ ...value, preferences: { ...preferences, directDeposit: checked as boolean } })}
                  />
                  <Label htmlFor="direct-deposit">Direct deposit funds</Label>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Current Debt */}
      <Collapsible open={expandedSections.debt} onOpenChange={() => toggleSection('debt')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Current Debt (Optional)</CardTitle>
                    <CardDescription>For debt consolidation comparisons</CardDescription>
                  </div>
                </div>
                {expandedSections.debt ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {currentDebt.map((debt, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <Select
                    value={debt.type || 'credit_card'}
                    onValueChange={(v: CurrentDebtInfo['type']) => updateDebt(index, { type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="personal_loan">Personal Loan</SelectItem>
                      <SelectItem value="auto_loan">Auto Loan</SelectItem>
                      <SelectItem value="student_loan">Student Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Balance $"
                    value={debt.balance || ''}
                    onChange={(e) => updateDebt(index, { balance: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    placeholder="Monthly $"
                    value={debt.monthlyPayment || ''}
                    onChange={(e) => updateDebt(index, { monthlyPayment: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="APR %"
                    value={debt.interestRate || ''}
                    onChange={(e) => updateDebt(index, { interestRate: parseFloat(e.target.value) || 0 })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeDebt(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addDebt}>
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// CREDIT CARD INPUTS
// ============================================================================

interface CreditCardInputsFormProps {
  value: Partial<CreditCardInputs>;
  onChange: (value: Partial<CreditCardInputs>) => void;
}

export function CreditCardInputsForm({ value, onChange }: CreditCardInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    applicant: true,
    spending: true,
    preferences: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const applicant = value.applicant || {
    creditScore: 700,
    creditHistory: 'good',
    annualIncome: 0,
    monthlyRent: 0,
    bankingRelationships: [],
    existingCardHolder: false
  };
  const spending = value.spending || {
    monthlySpending: {
      groceries: 0,
      dining: 0,
      gas: 0,
      travel: 0,
      onlineShopping: 0,
      utilities: 0,
      entertainment: 0,
      other: 0
    },
    largestCategories: [],
    balanceCarry: 'never',
    averageBalanceCarried: 0,
    travelFrequency: 'occasional',
    internationalTravel: false,
    preferredAirlines: [],
    preferredHotels: []
  };
  const preferences = value.preferences || {
    cardType: 'any',
    rewardsPreference: 'no_preference',
    rewardsPriority: {
      highRewardsRate: 5,
      signUpBonus: 5,
      flexibleRedemption: 5,
      noExpiration: 5,
      transferPartners: 3
    },
    annualFeeMax: 100,
    foreignTransactionFee: 'not_acceptable',
    balanceTransferFee: 'acceptable',
    features: {
      introApr: false,
      balanceTransferOffer: false,
      purchaseProtection: false,
      extendedWarranty: false,
      travelInsurance: false,
      loungeAccess: false,
      tsa_precheck_credit: false,
      cellPhoneProtection: false,
      noForeignTransactionFee: false
    },
    networkPreference: 'any',
    metalCard: false
  };

  return (
    <div className="space-y-6">
      {/* Applicant Info */}
      <Collapsible open={expandedSections.applicant} onOpenChange={() => toggleSection('applicant')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Your Profile</CardTitle>
                    <CardDescription>Credit and income information</CardDescription>
                  </div>
                </div>
                {expandedSections.applicant ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Credit Score *</Label>
                  <Input
                    type="number"
                    placeholder="300-850"
                    min={300}
                    max={850}
                    value={applicant.creditScore || ''}
                    onChange={(e) => onChange({ ...value, applicant: { ...applicant, creditScore: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credit History</Label>
                  <Select
                    value={applicant.creditHistory || 'good'}
                    onValueChange={(v: typeof applicant.creditHistory) => 
                      onChange({ ...value, applicant: { ...applicant, creditHistory: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent (750+)</SelectItem>
                      <SelectItem value="good">Good (700-749)</SelectItem>
                      <SelectItem value="fair">Fair (650-699)</SelectItem>
                      <SelectItem value="poor">Poor (below 650)</SelectItem>
                      <SelectItem value="none">No Credit History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Annual Income</Label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={applicant.annualIncome || ''}
                    onChange={(e) => onChange({ ...value, applicant: { ...applicant, annualIncome: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent/Mortgage</Label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={applicant.monthlyRent || ''}
                    onChange={(e) => onChange({ ...value, applicant: { ...applicant, monthlyRent: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Spending Profile */}
      <Collapsible open={expandedSections.spending} onOpenChange={() => toggleSection('spending')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Spending Profile</CardTitle>
                    <CardDescription>Where do you spend the most?</CardDescription>
                  </div>
                </div>
                {expandedSections.spending ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Monthly Spending by Category ($)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'groceries', label: 'Groceries' },
                    { key: 'dining', label: 'Dining/Restaurants' },
                    { key: 'gas', label: 'Gas/Fuel' },
                    { key: 'travel', label: 'Travel' },
                    { key: 'onlineShopping', label: 'Online Shopping' },
                    { key: 'utilities', label: 'Utilities/Bills' },
                    { key: 'entertainment', label: 'Entertainment' },
                    { key: 'other', label: 'Other' },
                  ].map(category => (
                    <div key={category.key} className="space-y-1">
                      <Label className="text-xs">{category.label}</Label>
                      <Input
                        type="number"
                        placeholder="$"
                        className="h-9"
                        value={spending.monthlySpending?.[category.key as keyof typeof spending.monthlySpending] || ''}
                        onChange={(e) => 
                          onChange({ 
                            ...value, 
                            spending: { 
                              ...spending, 
                              monthlySpending: { 
                                ...spending.monthlySpending, 
                                [category.key]: parseInt(e.target.value) || 0 
                              } 
                            } 
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Balance Carry</Label>
                  <Select
                    value={spending.balanceCarry || 'never'}
                    onValueChange={(v: typeof spending.balanceCarry) => 
                      onChange({ ...value, spending: { ...spending, balanceCarry: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never (pay in full)</SelectItem>
                      <SelectItem value="sometimes">Sometimes</SelectItem>
                      <SelectItem value="usually">Usually</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Travel Frequency</Label>
                  <Select
                    value={spending.travelFrequency || 'occasional'}
                    onValueChange={(v: typeof spending.travelFrequency) => 
                      onChange({ ...value, spending: { ...spending, travelFrequency: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="occasional">1-2 trips/year</SelectItem>
                      <SelectItem value="frequent">3-5 trips/year</SelectItem>
                      <SelectItem value="very_frequent">6+ trips/year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-7">
                  <Checkbox
                    id="intl-travel"
                    checked={spending.internationalTravel || false}
                    onCheckedChange={(checked) => onChange({ ...value, spending: { ...spending, internationalTravel: checked as boolean } })}
                  />
                  <Label htmlFor="intl-travel">International Travel</Label>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card Preferences */}
      <Collapsible open={expandedSections.preferences} onOpenChange={() => toggleSection('preferences')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Card Preferences</CardTitle>
                    <CardDescription>What type of card are you looking for?</CardDescription>
                  </div>
                </div>
                {expandedSections.preferences ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Card Type</Label>
                  <Select
                    value={preferences.cardType || 'any'}
                    onValueChange={(v: typeof preferences.cardType) => 
                      onChange({ ...value, preferences: { ...preferences, cardType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_back">Cash Back</SelectItem>
                      <SelectItem value="travel_rewards">Travel Rewards</SelectItem>
                      <SelectItem value="balance_transfer">Balance Transfer</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="secured">Secured (Building Credit)</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="any">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rewards Preference</Label>
                  <Select
                    value={preferences.rewardsPreference || 'no_preference'}
                    onValueChange={(v: typeof preferences.rewardsPreference) => 
                      onChange({ ...value, preferences: { ...preferences, rewardsPreference: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_back">Cash Back</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="miles">Miles</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Annual Fee</Label>
                  <Select
                    value={preferences.annualFeeMax?.toString() || '100'}
                    onValueChange={(v) => onChange({ ...value, preferences: { ...preferences, annualFeeMax: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">$0 (No Fee)</SelectItem>
                      <SelectItem value="100">Up to $100</SelectItem>
                      <SelectItem value="250">Up to $250</SelectItem>
                      <SelectItem value="500">Up to $500</SelectItem>
                      <SelectItem value="1000">Any Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Network</Label>
                  <Select
                    value={preferences.networkPreference || 'any'}
                    onValueChange={(v: typeof preferences.networkPreference) => 
                      onChange({ ...value, preferences: { ...preferences, networkPreference: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="discover">Discover</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Important Features */}
              <div className="space-y-2">
                <Label>Important Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'introApr', label: '0% Intro APR' },
                    { key: 'balanceTransferOffer', label: 'Balance Transfer Offer' },
                    { key: 'purchaseProtection', label: 'Purchase Protection' },
                    { key: 'extendedWarranty', label: 'Extended Warranty' },
                    { key: 'travelInsurance', label: 'Travel Insurance' },
                    { key: 'loungeAccess', label: 'Airport Lounge Access' },
                    { key: 'tsa_precheck_credit', label: 'TSA PreCheck Credit' },
                    { key: 'cellPhoneProtection', label: 'Cell Phone Protection' },
                    { key: 'noForeignTransactionFee', label: 'No Foreign Transaction Fee' },
                  ].map(feature => (
                    <div key={feature.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cc-${feature.key}`}
                        checked={preferences.features?.[feature.key as keyof typeof preferences.features] || false}
                        onCheckedChange={(checked) => 
                          onChange({ 
                            ...value, 
                            preferences: { 
                              ...preferences, 
                              features: { ...preferences.features, [feature.key]: checked as boolean } 
                            } 
                          })
                        }
                      />
                      <Label htmlFor={`cc-${feature.key}`}>{feature.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export default LoanServiceInputsForm;



