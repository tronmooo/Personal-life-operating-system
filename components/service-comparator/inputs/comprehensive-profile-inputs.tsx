'use client';

/**
 * Comprehensive Profile Inputs
 * Collects ALL factors beyond ZIP code for enhanced comparison
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { EnhancedComparisonFactors } from '@/lib/ai/enhanced-service-comparator';

interface ComprehensiveProfileInputsProps {
  factors: Partial<EnhancedComparisonFactors>;
  onChange: (factors: Partial<EnhancedComparisonFactors>) => void;
}

export function ComprehensiveProfileInputs({
  factors,
  onChange,
}: ComprehensiveProfileInputsProps) {
  const updateFactor = (category: keyof EnhancedComparisonFactors, field: string, value: any) => {
    onChange({
      ...factors,
      [category]: {
        ...factors[category],
        [field]: value,
      },
    });
  };

  return (
    <Accordion type="multiple" className="w-full">
      {/* Personal Factors */}
      <AccordionItem value="personal">
        <AccordionTrigger>Personal Information</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Age</Label>
              <Input
                type="number"
                placeholder="35"
                value={factors.personal?.age || ''}
                onChange={(e) => updateFactor('personal', 'age', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Household Size</Label>
              <Input
                type="number"
                placeholder="4"
                value={factors.personal?.householdSize || ''}
                onChange={(e) => updateFactor('personal', 'householdSize', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Income</Label>
              <Input
                type="number"
                placeholder="75000"
                value={factors.personal?.income || ''}
                onChange={(e) => updateFactor('personal', 'income', parseFloat(e.target.value) || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Home Ownership</Label>
              <Select
                value={factors.personal?.homeOwnership}
                onValueChange={(value) => updateFactor('personal', 'homeOwnership', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">Own</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Financial Factors */}
      <AccordionItem value="financial">
        <AccordionTrigger>Financial Preferences</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Monthly Budget Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Min $"
                  value={factors.financial?.budgetConstraints?.[0] || ''}
                  onChange={(e) =>
                    updateFactor('financial', 'budgetConstraints', [
                      parseFloat(e.target.value) || 0,
                      factors.financial?.budgetConstraints?.[1] || 500,
                    ])
                  }
                />
                <Input
                  type="number"
                  placeholder="Max $"
                  value={factors.financial?.budgetConstraints?.[1] || ''}
                  onChange={(e) =>
                    updateFactor('financial', 'budgetConstraints', [
                      factors.financial?.budgetConstraints?.[0] || 0,
                      parseFloat(e.target.value) || 500,
                    ])
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Preference</Label>
              <Select
                value={factors.financial?.paymentPreference}
                onValueChange={(value) => updateFactor('financial', 'paymentPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price Flexibility (1-10): {factors.financial?.priceFlexibility || 5}</Label>
              <Slider
                value={[factors.financial?.priceFlexibility || 5]}
                onValueChange={(value) => updateFactor('financial', 'priceFlexibility', value[0])}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                1 = Must stay in budget, 10 = Willing to pay more for quality
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Risk Factors */}
      <AccordionItem value="risk">
        <AccordionTrigger>Risk Profile</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Credit History</Label>
              <Select
                value={factors.risk?.creditHistory}
                onValueChange={(value) => updateFactor('risk', 'creditHistory', value)}
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
              <Label>Risk Tolerance (1-10): {factors.risk?.riskTolerance || 5}</Label>
              <Slider
                value={[factors.risk?.riskTolerance || 5]}
                onValueChange={(value) => updateFactor('risk', 'riskTolerance', value[0])}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                1 = Very risk-averse, 10 = Risk-tolerant
              </p>
            </div>
            <div className="space-y-2">
              <Label>Security Preference</Label>
              <Select
                value={factors.risk?.securityPreference}
                onValueChange={(value) => updateFactor('risk', 'securityPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Security Priority</SelectItem>
                  <SelectItem value="medium">Medium Security</SelectItem>
                  <SelectItem value="low">Low Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Behavioral Factors */}
      <AccordionItem value="behavior">
        <AccordionTrigger>Behavioral Preferences</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Brand Loyalty (1-10): {factors.behavior?.brandLoyalty || 5}</Label>
              <Slider
                value={[factors.behavior?.brandLoyalty || 5]}
                onValueChange={(value) => updateFactor('behavior', 'brandLoyalty', value[0])}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                1 = Always switch for better deals, 10 = Stick with known brands
              </p>
            </div>
            <div className="space-y-2">
              <Label>Times Switched Providers (Past 5 Years)</Label>
              <Input
                type="number"
                placeholder="2"
                value={factors.behavior?.switchingHistory || ''}
                onChange={(e) => updateFactor('behavior', 'switchingHistory', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price vs Quality Focus</Label>
              <Select
                value={factors.behavior?.priceVsQuality}
                onValueChange={(value) => updateFactor('behavior', 'priceVsQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-focused">Price-Focused</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="quality-focused">Quality-Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Environmental Factors */}
      <AccordionItem value="environment">
        <AccordionTrigger>Environmental & Social Values</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="green-energy"
                checked={factors.environment?.greenEnergyPreference}
                onCheckedChange={(checked) =>
                  updateFactor('environment', 'greenEnergyPreference', checked)
                }
              />
              <label htmlFor="green-energy" className="text-sm">
                Prefer green/renewable energy providers
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="local-business"
                checked={factors.environment?.localBusinessPreference}
                onCheckedChange={(checked) =>
                  updateFactor('environment', 'localBusinessPreference', checked)
                }
              />
              <label htmlFor="local-business" className="text-sm">
                Prefer local/regional businesses over national chains
              </label>
            </div>
            <div className="space-y-2">
              <Label>Carbon Footprint Concern (1-10): {factors.environment?.carbonFootprintConcern || 5}</Label>
              <Slider
                value={[factors.environment?.carbonFootprintConcern || 5]}
                onValueChange={(value) => updateFactor('environment', 'carbonFootprintConcern', value[0])}
                min={1}
                max={10}
                step={1}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Technology Factors */}
      <AccordionItem value="technology">
        <AccordionTrigger>Technology Requirements</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="app-quality"
                checked={factors.technology?.appQuality}
                onCheckedChange={(checked) => updateFactor('technology', 'appQuality', checked)}
              />
              <label htmlFor="app-quality" className="text-sm">
                High-quality mobile app is important
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="online-management"
                checked={factors.technology?.onlineManagement}
                onCheckedChange={(checked) => updateFactor('technology', 'onlineManagement', checked)}
              />
              <label htmlFor="online-management" className="text-sm">
                Full online account management required
              </label>
            </div>
            <div className="space-y-2">
              <Label>Automation Level Preference</Label>
              <Select
                value={factors.technology?.automationLevel}
                onValueChange={(value) => updateFactor('technology', 'automationLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Prefer human interaction</SelectItem>
                  <SelectItem value="medium">Medium - Mix of both</SelectItem>
                  <SelectItem value="high">High - Fully automated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Service Factors */}
      <AccordionItem value="service">
        <AccordionTrigger>Service Quality Expectations</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Customer Service Hours</Label>
              <Select
                value={factors.service?.customerServiceHours}
                onValueChange={(value) => updateFactor('service', 'customerServiceHours', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24/7">24/7 Availability</SelectItem>
                  <SelectItem value="extended">Extended Hours (6am-10pm)</SelectItem>
                  <SelectItem value="business">Business Hours Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Response Time Expectation</Label>
              <Select
                value={factors.service?.responseTime}
                onValueChange={(value) => updateFactor('service', 'responseTime', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (&lt;5 min)</SelectItem>
                  <SelectItem value="same-day">Same Day</SelectItem>
                  <SelectItem value="24-hours">Within 24 Hours</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multilingual"
                checked={factors.service?.multilingual}
                onCheckedChange={(checked) => updateFactor('service', 'multilingual', checked)}
              />
              <label htmlFor="multilingual" className="text-sm">
                Multilingual support needed
              </label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}












