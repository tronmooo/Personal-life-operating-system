'use client';

/**
 * Comprehensive Insurance Inputs for All Types
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ComparisonRequest } from '@/types/service-comparator';

interface InsuranceInputsProps {
  formData: Partial<ComparisonRequest>;
  onChange: (data: Partial<ComparisonRequest>) => void;
  insuranceType: 'health' | 'life' | 'pet';
}

export function AllInsuranceInputs({ formData, onChange, insuranceType }: InsuranceInputsProps) {
  const updateField = (category: 'user_profile' | 'usage_profile' | 'preferences', field: string, value: any) => {
    onChange({
      ...formData,
      [category]: {
        ...formData[category],
        [field]: value,
      },
    });
  };

  if (insuranceType === 'health') {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Health Insurance Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Age</Label>
            <Input
              type="number"
              placeholder="35"
              value={formData.user_profile?.age || ''}
              onChange={(e) => updateField('user_profile', 'age', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Household Size</Label>
            <Input
              type="number"
              placeholder="4"
              value={formData.user_profile?.household_size || ''}
              onChange={(e) => updateField('user_profile', 'household_size', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Annual Medical Visits (Expected)</Label>
            <Input
              type="number"
              placeholder="5"
              value={formData.usage_profile?.medical_visits_expected || ''}
              onChange={(e) => updateField('usage_profile', 'medical_visits_expected', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Preferred Deductible Range</Label>
            <Select
              value={formData.preferences?.deductible_range?.[0]?.toString()}
              onValueChange={(value) =>
                updateField('preferences', 'deductible_range', [parseInt(value), parseInt(value) * 2])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500">$500 - $1,000</SelectItem>
                <SelectItem value="1000">$1,000 - $2,000</SelectItem>
                <SelectItem value="2000">$2,000 - $4,000</SelectItem>
                <SelectItem value="5000">$5,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Pre-existing Conditions or Special Needs</Label>
            <Textarea
              placeholder="Describe any relevant medical conditions..."
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  }

  if (insuranceType === 'life') {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Life Insurance Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Age</Label>
            <Input
              type="number"
              placeholder="35"
              value={formData.user_profile?.age || ''}
              onChange={(e) => updateField('user_profile', 'age', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Desired Coverage Amount</Label>
            <Input
              type="number"
              placeholder="500000"
              value={formData.preferences?.coverage_limits?.life || ''}
              onChange={(e) =>
                updateField('preferences', 'coverage_limits', {
                  ...formData.preferences?.coverage_limits,
                  life: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Term Length</Label>
            <Select
              onValueChange={(value) =>
                updateField('preferences', 'contract_length', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Years</SelectItem>
                <SelectItem value="20">20 Years</SelectItem>
                <SelectItem value="30">30 Years</SelectItem>
                <SelectItem value="whole">Whole Life</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Number of Dependents</Label>
            <Input
              type="number"
              placeholder="2"
              value={formData.user_profile?.household_size || ''}
              onChange={(e) => updateField('user_profile', 'household_size', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Health Status</Label>
            <Select
              onValueChange={(value) =>
                updateField('user_profile', 'driving_record', value as any)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent Health</SelectItem>
                <SelectItem value="good">Good Health</SelectItem>
                <SelectItem value="fair">Fair Health</SelectItem>
                <SelectItem value="poor">Poor Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (insuranceType === 'pet') {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Pet Insurance Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pet Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pet Age</Label>
            <Input
              type="number"
              placeholder="3"
              value={formData.usage_profile?.pet_age || ''}
              onChange={(e) => updateField('usage_profile', 'pet_age', parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pet Breed</Label>
            <Input
              placeholder="Labrador Retriever"
              value={formData.usage_profile?.pet_breed || ''}
              onChange={(e) => updateField('usage_profile', 'pet_breed', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pre-existing Conditions</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="minor">Minor Conditions</SelectItem>
                <SelectItem value="major">Major Conditions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Coverage Preferences</Label>
            <Textarea
              placeholder="Wellness, accidents, illness, dental..."
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}





















