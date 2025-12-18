'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Home, 
  Construction, 
  Shield, 
  Lock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
  Droplets
} from 'lucide-react';
import type { HomeInsuranceInputs, PropertyInfo, ConstructionDetails, SafetyFeatures, ScheduledItem } from '@/types/service-comparator-inputs';

interface HomeInsuranceInputsFormProps {
  value: Partial<HomeInsuranceInputs>;
  onChange: (value: Partial<HomeInsuranceInputs>) => void;
}

const EXTERIOR_WALLS = [
  { value: 'brick', label: 'Brick' },
  { value: 'stone', label: 'Stone' },
  { value: 'stucco', label: 'Stucco' },
  { value: 'vinyl', label: 'Vinyl Siding' },
  { value: 'wood', label: 'Wood' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'fiber_cement', label: 'Fiber Cement' },
  { value: 'other', label: 'Other' }
];

const ROOF_TYPES = [
  { value: 'asphalt_shingle', label: 'Asphalt Shingle' },
  { value: 'tile', label: 'Tile (Clay/Concrete)' },
  { value: 'metal', label: 'Metal' },
  { value: 'slate', label: 'Slate' },
  { value: 'wood_shake', label: 'Wood Shake' },
  { value: 'flat', label: 'Flat/Built-up' },
  { value: 'other', label: 'Other' }
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export function HomeInsuranceInputsForm({ value, onChange }: HomeInsuranceInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    property: true,
    construction: true,
    safety: false,
    coverage: false,
    claims: false,
    current: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const property = value.property || {} as PropertyInfo;
  const construction = value.construction || {} as ConstructionDetails;
  const safety = value.safety || {} as SafetyFeatures;
  const coverage = value.coverage || {
    dwellingCoverage: 0,
    otherStructures: 0,
    personalProperty: 0,
    lossOfUse: 0,
    personalLiability: 300000,
    medicalPayments: 5000,
    deductible: 1000,
    waterBackup: false,
    equipmentBreakdown: false,
    identityTheft: false,
    homeBusinessCoverage: false,
    scheduledPersonalProperty: [],
    floodInsurance: false,
    earthquakeInsurance: false,
    windstormInsurance: false,
    umbrellaPolicy: false
  };
  const claimsHistory = value.claimsHistory || [];

  const updateProperty = (updates: Partial<PropertyInfo>) => {
    onChange({ ...value, property: { ...property, ...updates } as PropertyInfo });
  };

  const updateConstruction = (updates: Partial<ConstructionDetails>) => {
    onChange({ ...value, construction: { ...construction, ...updates } as ConstructionDetails });
  };

  const updateSafety = (updates: Partial<SafetyFeatures>) => {
    onChange({ ...value, safety: { ...safety, ...updates } as SafetyFeatures });
  };

  return (
    <div className="space-y-6">
      {/* Property Information */}
      <Collapsible open={expandedSections.property} onOpenChange={() => toggleSection('property')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Property Information</CardTitle>
                    <CardDescription>Details about your home</CardDescription>
                  </div>
                </div>
                {expandedSections.property ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Address */}
              <div className="space-y-4">
                <h4 className="font-medium">Property Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      placeholder="123 Main Street"
                      value={property.address || ''}
                      onChange={(e) => updateProperty({ address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={property.city || ''}
                      onChange={(e) => updateProperty({ city: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select value={property.state || ''} onValueChange={(v) => updateProperty({ state: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP Code</Label>
                      <Input
                        placeholder="12345"
                        maxLength={5}
                        value={property.zipCode || ''}
                        onChange={(e) => updateProperty({ zipCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-4">
                <h4 className="font-medium">Property Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select
                      value={property.propertyType || ''}
                      onValueChange={(v: PropertyInfo['propertyType']) => updateProperty({ propertyType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family Home</SelectItem>
                        <SelectItem value="condo">Condo/Co-op</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="multi_family">Multi-Family (2-4 units)</SelectItem>
                        <SelectItem value="mobile_home">Mobile Home</SelectItem>
                        <SelectItem value="manufactured">Manufactured Home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ownership</Label>
                    <Select
                      value={property.ownershipStatus || ''}
                      onValueChange={(v: PropertyInfo['ownershipStatus']) => updateProperty({ ownershipStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary Residence</SelectItem>
                        <SelectItem value="secondary">Secondary/Vacation</SelectItem>
                        <SelectItem value="rental">Rental Property</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Occupancy</Label>
                    <Select
                      value={property.occupancy || ''}
                      onValueChange={(v: PropertyInfo['occupancy']) => updateProperty({ occupancy: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
                        <SelectItem value="tenant_occupied">Tenant Occupied</SelectItem>
                        <SelectItem value="vacation">Vacation Home</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year Built</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1995"
                      min={1800}
                      max={new Date().getFullYear()}
                      value={property.yearBuilt || ''}
                      onChange={(e) => updateProperty({ yearBuilt: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Square Footage</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 2000"
                      value={property.squareFootage || ''}
                      onChange={(e) => updateProperty({ squareFootage: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Stories</Label>
                    <Select
                      value={property.stories?.toString() || ''}
                      onValueChange={(v) => updateProperty({ stories: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Story</SelectItem>
                        <SelectItem value="1.5">1.5 Stories</SelectItem>
                        <SelectItem value="2">2 Stories</SelectItem>
                        <SelectItem value="2.5">2.5 Stories</SelectItem>
                        <SelectItem value="3">3+ Stories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Select
                      value={property.numberOfBedrooms?.toString() || ''}
                      onValueChange={(v) => updateProperty({ numberOfBedrooms: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bathrooms</Label>
                    <Select
                      value={property.numberOfBathrooms?.toString() || ''}
                      onValueChange={(v) => updateProperty({ numberOfBathrooms: parseFloat(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Basement</Label>
                    <Select
                      value={property.basementType || ''}
                      onValueChange={(v: PropertyInfo['basementType']) => updateProperty({ basementType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Basement</SelectItem>
                        <SelectItem value="partial">Partial Basement</SelectItem>
                        <SelectItem value="crawl">Crawl Space</SelectItem>
                        <SelectItem value="slab">Slab Foundation</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Garage Type</Label>
                    <Select
                      value={property.garageType || ''}
                      onValueChange={(v: PropertyInfo['garageType']) => updateProperty({ garageType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attached">Attached</SelectItem>
                        <SelectItem value="detached">Detached</SelectItem>
                        <SelectItem value="carport">Carport</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pool</Label>
                    <Select
                      value={property.poolType || ''}
                      onValueChange={(v: PropertyInfo['poolType']) => updateProperty({ poolType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inground">Inground Pool</SelectItem>
                        <SelectItem value="above_ground">Above Ground</SelectItem>
                        <SelectItem value="none">No Pool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fenced"
                        checked={property.fencedYard || false}
                        onCheckedChange={(checked) => updateProperty({ fencedYard: checked as boolean })}
                      />
                      <Label htmlFor="fenced">Fenced Yard</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trampoline"
                        checked={property.trampolinePresent || false}
                        onCheckedChange={(checked) => updateProperty({ trampolinePresent: checked as boolean })}
                      />
                      <Label htmlFor="trampoline">Trampoline</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Value Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Property Value</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Home Value</Label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={property.estimatedValue || ''}
                      onChange={(e) => updateProperty({ estimatedValue: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price</Label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={property.purchasePrice || ''}
                      onChange={(e) => updateProperty({ purchasePrice: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Input
                      type="date"
                      value={property.purchaseDate || ''}
                      onChange={(e) => updateProperty({ purchaseDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Construction Details */}
      <Collapsible open={expandedSections.construction} onOpenChange={() => toggleSection('construction')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Construction className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Construction Details</CardTitle>
                    <CardDescription>Building materials and systems</CardDescription>
                  </div>
                </div>
                {expandedSections.construction ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Exterior Walls</Label>
                  <Select
                    value={construction.exteriorWalls || ''}
                    onValueChange={(v: ConstructionDetails['exteriorWalls']) => updateConstruction({ exteriorWalls: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTERIOR_WALLS.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Roof Type</Label>
                  <Select
                    value={construction.roofType || ''}
                    onValueChange={(v: ConstructionDetails['roofType']) => updateConstruction({ roofType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOF_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Roof Age (Years)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    min={0}
                    max={100}
                    value={construction.roofAge || ''}
                    onChange={(e) => updateConstruction({ roofAge: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Electrical Amps</Label>
                  <Select
                    value={construction.electricalAmps?.toString() || ''}
                    onValueChange={(v) => updateConstruction({ electricalAmps: parseInt(v) as ConstructionDetails['electricalAmps'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 Amps</SelectItem>
                      <SelectItem value="100">100 Amps</SelectItem>
                      <SelectItem value="150">150 Amps</SelectItem>
                      <SelectItem value="200">200 Amps</SelectItem>
                      <SelectItem value="400">400 Amps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Heating Type</Label>
                  <Select
                    value={construction.heatingType || ''}
                    onValueChange={(v: ConstructionDetails['heatingType']) => updateConstruction({ heatingType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central_gas">Central Gas</SelectItem>
                      <SelectItem value="central_electric">Central Electric</SelectItem>
                      <SelectItem value="heat_pump">Heat Pump</SelectItem>
                      <SelectItem value="oil">Oil</SelectItem>
                      <SelectItem value="propane">Propane</SelectItem>
                      <SelectItem value="wood">Wood/Pellet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cooling Type</Label>
                  <Select
                    value={construction.coolingType || ''}
                    onValueChange={(v: ConstructionDetails['coolingType']) => updateConstruction({ coolingType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central_air">Central Air</SelectItem>
                      <SelectItem value="window_units">Window Units</SelectItem>
                      <SelectItem value="evaporative">Evaporative</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plumbing Type</Label>
                  <Select
                    value={construction.plumbingType || ''}
                    onValueChange={(v: ConstructionDetails['plumbingType']) => updateConstruction({ plumbingType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copper">Copper</SelectItem>
                      <SelectItem value="pvc">PVC/CPVC</SelectItem>
                      <SelectItem value="pex">PEX</SelectItem>
                      <SelectItem value="galvanized">Galvanized</SelectItem>
                      <SelectItem value="polybutylene">Polybutylene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wiring Type</Label>
                  <Select
                    value={construction.wiringType || ''}
                    onValueChange={(v: ConstructionDetails['wiringType']) => updateConstruction({ wiringType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copper">Copper</SelectItem>
                      <SelectItem value="aluminum">Aluminum</SelectItem>
                      <SelectItem value="knob_and_tube">Knob & Tube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recent Updates */}
              <div className="space-y-4">
                <h4 className="font-medium">Recent Updates (Year Completed)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['roof', 'electrical', 'plumbing', 'heating', 'kitchen', 'bathroom'].map(item => (
                    <div key={item} className="space-y-2">
                      <Label className="capitalize">{item}</Label>
                      <Input
                        type="number"
                        placeholder="Year (e.g., 2020)"
                        min={1900}
                        max={new Date().getFullYear()}
                        value={construction.updates?.[item as keyof typeof construction.updates] || ''}
                        onChange={(e) => {
                          const updates = construction.updates || { roof: null, electrical: null, plumbing: null, heating: null, kitchen: null, bathroom: null };
                          updateConstruction({
                            updates: {
                              ...updates,
                              [item]: e.target.value ? parseInt(e.target.value) : null
                            }
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Safety & Security */}
      <Collapsible open={expandedSections.safety} onOpenChange={() => toggleSection('safety')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Safety & Security</CardTitle>
                    <CardDescription>Protection features can reduce your premium</CardDescription>
                  </div>
                </div>
                {expandedSections.safety ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Fire Safety */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <h4 className="font-medium">Fire Safety</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Smoke Detectors</Label>
                    <Select
                      value={safety.smokeDetectors || ''}
                      onValueChange={(v: SafetyFeatures['smokeDetectors']) => updateSafety({ smokeDetectors: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="battery">Battery Operated</SelectItem>
                        <SelectItem value="hardwired">Hardwired</SelectItem>
                        <SelectItem value="monitored">Monitored System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fire Alarm</Label>
                    <Select
                      value={safety.fireAlarm || ''}
                      onValueChange={(v: SafetyFeatures['fireAlarm']) => updateSafety({ fireAlarm: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="local">Local Alarm</SelectItem>
                        <SelectItem value="central_station">Central Station Monitored</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <Checkbox
                      id="co-detector"
                      checked={safety.carbonMonoxideDetectors || false}
                      onCheckedChange={(checked) => updateSafety({ carbonMonoxideDetectors: checked as boolean })}
                    />
                    <Label htmlFor="co-detector">CO Detectors</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <Checkbox
                      id="sprinkler"
                      checked={safety.sprinklerSystem || false}
                      onCheckedChange={(checked) => updateSafety({ sprinklerSystem: checked as boolean })}
                    />
                    <Label htmlFor="sprinkler">Sprinkler System</Label>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium">Security</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Burglar Alarm</Label>
                    <Select
                      value={safety.burglarAlarm || ''}
                      onValueChange={(v: SafetyFeatures['burglarAlarm']) => updateSafety({ burglarAlarm: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="local">Local Alarm</SelectItem>
                        <SelectItem value="central_station">Central Station Monitored</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {[
                    { id: 'cameras', label: 'Security Cameras', key: 'securityCameras' },
                    { id: 'deadbolts', label: 'Deadbolt Locks', key: 'deadboltLocks' },
                    { id: 'gated', label: 'Gated Community', key: 'gatedCommunity' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center space-x-2 pt-7">
                      <Checkbox
                        id={item.id}
                        checked={safety[item.key as keyof SafetyFeatures] as boolean || false}
                        onCheckedChange={(checked) => updateSafety({ [item.key]: checked as boolean })}
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Water & Storm */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  <h4 className="font-medium">Water & Storm Protection</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'sump', label: 'Sump Pump', key: 'sumpPump' },
                    { id: 'leak', label: 'Water Leak Detectors', key: 'waterLeakDetectors' },
                    { id: 'shutters', label: 'Storm Shutters', key: 'stormShutters' },
                    { id: 'impact-roof', label: 'Impact Resistant Roof', key: 'impactResistantRoof' },
                    { id: 'generator', label: 'Backup Generator', key: 'generatorBackup' },
                    { id: 'fire-hydrant', label: 'Near Fire Hydrant', key: 'nearFireHydrant' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={safety[item.key as keyof SafetyFeatures] as boolean || false}
                        onCheckedChange={(checked) => updateSafety({ [item.key]: checked as boolean })}
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Coverage Preferences */}
      <Collapsible open={expandedSections.coverage} onOpenChange={() => toggleSection('coverage')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Coverage Preferences</CardTitle>
                    <CardDescription>Set your coverage amounts and deductibles</CardDescription>
                  </div>
                </div>
                {expandedSections.coverage ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Dwelling Coverage</Label>
                  <Input
                    type="number"
                    placeholder="$ (rebuilding cost)"
                    value={coverage.dwellingCoverage || ''}
                    onChange={(e) => onChange({ ...value, coverage: { ...coverage, dwellingCoverage: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Property</Label>
                  <Input
                    type="number"
                    placeholder="$ (contents value)"
                    value={coverage.personalProperty || ''}
                    onChange={(e) => onChange({ ...value, coverage: { ...coverage, personalProperty: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Liability</Label>
                  <Select
                    value={coverage.personalLiability?.toString() || ''}
                    onValueChange={(v) => onChange({ ...value, coverage: { ...coverage, personalLiability: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100000">$100,000</SelectItem>
                      <SelectItem value="300000">$300,000 (Recommended)</SelectItem>
                      <SelectItem value="500000">$500,000</SelectItem>
                      <SelectItem value="1000000">$1,000,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Deductible</Label>
                  <Select
                    value={coverage.deductible?.toString() || ''}
                    onValueChange={(v) => onChange({ ...value, coverage: { ...coverage, deductible: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">$500</SelectItem>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="2000">$2,000</SelectItem>
                      <SelectItem value="2500">$2,500</SelectItem>
                      <SelectItem value="5000">$5,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Medical Payments</Label>
                  <Select
                    value={coverage.medicalPayments?.toString() || ''}
                    onValueChange={(v) => onChange({ ...value, coverage: { ...coverage, medicalPayments: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="2500">$2,500</SelectItem>
                      <SelectItem value="5000">$5,000</SelectItem>
                      <SelectItem value="10000">$10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Coverages */}
              <div className="space-y-4">
                <h4 className="font-medium">Additional Coverages</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'water-backup', label: 'Water Backup', key: 'waterBackup' },
                    { id: 'equipment', label: 'Equipment Breakdown', key: 'equipmentBreakdown' },
                    { id: 'identity', label: 'Identity Theft Protection', key: 'identityTheft' },
                    { id: 'home-business', label: 'Home Business Coverage', key: 'homeBusinessCoverage' },
                    { id: 'flood', label: 'Flood Insurance', key: 'floodInsurance' },
                    { id: 'earthquake', label: 'Earthquake Insurance', key: 'earthquakeInsurance' },
                    { id: 'windstorm', label: 'Windstorm/Hail', key: 'windstormInsurance' },
                    { id: 'umbrella', label: 'Umbrella Policy', key: 'umbrellaPolicy' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={coverage[item.key as keyof typeof coverage] as boolean || false}
                        onCheckedChange={(checked) => onChange({ ...value, coverage: { ...coverage, [item.key]: checked as boolean } })}
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
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

export default HomeInsuranceInputsForm;



