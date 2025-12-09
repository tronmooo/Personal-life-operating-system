'use client';

/**
 * Financial Services Inputs (Loans & Credit Cards)
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ComparisonRequest } from '@/types/service-comparator';

interface FinancialServicesInputsProps {
  formData: Partial<ComparisonRequest>;
  onChange: (data: Partial<ComparisonRequest>) => void;
  serviceType: 'loans' | 'credit_cards';
}

export function FinancialServicesInputs({ formData, onChange, serviceType }: FinancialServicesInputsProps) {
  const updateField = (category: 'user_profile' | 'usage_profile' | 'preferences', field: string, value: any) => {
    onChange({
      ...formData,
      [category]: {
        ...formData[category],
        [field]: value,
      },
    });
  };

  if (serviceType === 'loans') {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Personal Loan Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Loan Amount Needed</Label>
            <Input
              type="number"
              placeholder="25000"
              onChange={(e) =>
                updateField('preferences', 'coverage_limits', {
                  ...formData.preferences?.coverage_limits,
                  loan_amount: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Desired Loan Term</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">1 Year</SelectItem>
                <SelectItem value="24">2 Years</SelectItem>
                <SelectItem value="36">3 Years</SelectItem>
                <SelectItem value="60">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Credit Score Range</Label>
            <Select
              value={formData.user_profile?.credit_tier}
              onValueChange={(value) => updateField('user_profile', 'credit_tier', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent (750+)</SelectItem>
                <SelectItem value="good">Good (700-749)</SelectItem>
                <SelectItem value="fair">Fair (650-699)</SelectItem>
                <SelectItem value="poor">Poor (&lt;650)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Annual Income</Label>
            <Input
              type="number"
              placeholder="75000"
              value={formData.user_profile?.income || ''}
              onChange={(e) => updateField('user_profile', 'income', parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Loan Purpose</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debt-consolidation">Debt Consolidation</SelectItem>
                <SelectItem value="home-improvement">Home Improvement</SelectItem>
                <SelectItem value="medical">Medical Expenses</SelectItem>
                <SelectItem value="auto">Auto Purchase</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (serviceType === 'credit_cards') {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Credit Card Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Credit Score Range</Label>
            <Select
              value={formData.user_profile?.credit_tier}
              onValueChange={(value) => updateField('user_profile', 'credit_tier', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent (750+)</SelectItem>
                <SelectItem value="good">Good (700-749)</SelectItem>
                <SelectItem value="fair">Fair (650-699)</SelectItem>
                <SelectItem value="poor">Poor (&lt;650)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Average Monthly Spending</Label>
            <Input
              type="number"
              placeholder="3000"
              value={formData.usage_profile?.purchase_volume || ''}
              onChange={(e) => updateField('usage_profile', 'purchase_volume', parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Primary Spending Categories (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Groceries', 'Gas', 'Dining', 'Travel', 'Online Shopping', 'Bills'].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox id={category} />
                  <label htmlFor={category} className="text-sm">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Most Important Feature</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashback">Cash Back Rewards</SelectItem>
                <SelectItem value="travel">Travel Rewards</SelectItem>
                <SelectItem value="low-apr">Low APR</SelectItem>
                <SelectItem value="no-fee">No Annual Fee</SelectItem>
                <SelectItem value="sign-up-bonus">Sign-Up Bonus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


















