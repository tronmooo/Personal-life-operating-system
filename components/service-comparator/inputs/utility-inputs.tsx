'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Zap, 
  Flame, 
  Droplets,
  Home,
  Sun,
  Leaf,
  ChevronDown,
  ChevronUp,
  Car,
  Thermometer
} from 'lucide-react';
import type { 
  ElectricUtilityInputs, 
  GasUtilityInputs, 
  WaterUtilityInputs,
  UtilityPropertyInfo 
} from '@/types/service-comparator-inputs';

// ============================================================================
// ELECTRIC UTILITY INPUTS
// ============================================================================

interface ElectricUtilityInputsFormProps {
  value: Partial<ElectricUtilityInputs>;
  onChange: (value: Partial<ElectricUtilityInputs>) => void;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ElectricUtilityInputsForm({ value, onChange }: ElectricUtilityInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    property: true,
    usage: true,
    equipment: false,
    preferences: false,
    current: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const property = value.property || {} as UtilityPropertyInfo;
  const usage = value.usage || {
    monthlyUsageKwh: {
      january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
      july: 0, august: 0, september: 0, october: 0, november: 0, december: 0
    },
    peakUsageTimes: [],
    weekendUsagePattern: 'same',
    workFromHome: false,
    workFromHomeDays: 0,
    summerCooling: 'moderate',
    winterHeating: 'moderate',
    poolPumpUsage: false,
    hotTubUsage: false
  };
  const equipment = value.equipment || {
    heatingType: 'gas',
    coolingType: 'central_ac',
    waterHeaterType: 'gas',
    applianceAges: { hvac: 0, waterHeater: 0, refrigerator: 0, washerDryer: 0 },
    smartThermostat: false,
    ledLighting: false,
    energyStarAppliances: 0,
    insulationQuality: 'average',
    windowType: 'double_pane',
    electricVehicle: false,
    evChargingLevel: null,
    solarPanels: false,
    batteryStorage: false
  };
  const preferences = value.preferences || {
    planType: 'any',
    contractLength: 'no_preference',
    renewableEnergy: 'no_preference',
    priorities: {
      lowestRate: 5,
      priceStability: 5,
      greenEnergy: 3,
      noContractFees: 5,
      localCompany: 3,
      customerService: 5
    },
    budgetBilling: false
  };

  const updateProperty = (updates: Partial<UtilityPropertyInfo>) => {
    onChange({ ...value, property: { ...property, ...updates } as UtilityPropertyInfo });
  };

  const updateMonthlyUsage = (month: typeof MONTHS[number], kwh: number) => {
    onChange({
      ...value,
      usage: {
        ...usage,
        monthlyUsageKwh: {
          ...usage.monthlyUsageKwh,
          [month]: kwh
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Property Info */}
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
                    <CardDescription>Basic details about your property</CardDescription>
                  </div>
                </div>
                {expandedSections.property ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Service Address</Label>
                  <Input
                    placeholder="123 Main Street, City"
                    value={property.address || ''}
                    onChange={(e) => updateProperty({ address: e.target.value })}
                  />
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
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select
                    value={property.propertyType || ''}
                    onValueChange={(v: UtilityPropertyInfo['propertyType']) => updateProperty({ propertyType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family Home</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="mobile_home">Mobile Home</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>Year Built</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1995"
                    value={property.yearBuilt || ''}
                    onChange={(e) => updateProperty({ yearBuilt: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label># of Occupants</Label>
                  <Select
                    value={property.occupants?.toString() || ''}
                    onValueChange={(v) => updateProperty({ occupants: parseInt(v) })}
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
                  <Label>Ownership</Label>
                  <Select
                    value={property.homeOwnership || ''}
                    onValueChange={(v: 'own' | 'rent') => updateProperty({ homeOwnership: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own">Own</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Usage Info */}
      <Collapsible open={expandedSections.usage} onOpenChange={() => toggleSection('usage')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Usage Information</CardTitle>
                    <CardDescription>Historical and expected electricity usage</CardDescription>
                  </div>
                </div>
                {expandedSections.usage ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Monthly Usage */}
              <div className="space-y-4">
                <h4 className="font-medium">Monthly Usage (kWh) - Enter from your bills</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {MONTHS.map((month, idx) => (
                    <div key={month} className="space-y-1">
                      <Label className="text-xs">{MONTH_LABELS[idx]}</Label>
                      <Input
                        type="number"
                        placeholder="kWh"
                        className="h-9"
                        value={usage.monthlyUsageKwh?.[month] || ''}
                        onChange={(e) => updateMonthlyUsage(month, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Find this on your electric bill or enter estimated values. Average home uses 900-1200 kWh/month.
                </p>
              </div>

              {/* Usage Patterns */}
              <div className="space-y-4">
                <h4 className="font-medium">Usage Patterns</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Summer Cooling</Label>
                    <Select
                      value={usage.summerCooling || ''}
                      onValueChange={(v: typeof usage.summerCooling) => 
                        onChange({ ...value, usage: { ...usage, summerCooling: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heavy">Heavy (below 72°F)</SelectItem>
                        <SelectItem value="moderate">Moderate (72-76°F)</SelectItem>
                        <SelectItem value="light">Light (above 76°F)</SelectItem>
                        <SelectItem value="none">No A/C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Winter Heating (Electric)</Label>
                    <Select
                      value={usage.winterHeating || ''}
                      onValueChange={(v: typeof usage.winterHeating) => 
                        onChange({ ...value, usage: { ...usage, winterHeating: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heavy">Heavy (above 72°F)</SelectItem>
                        <SelectItem value="moderate">Moderate (68-72°F)</SelectItem>
                        <SelectItem value="light">Light (below 68°F)</SelectItem>
                        <SelectItem value="none">No Electric Heat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weekend Usage</Label>
                    <Select
                      value={usage.weekendUsagePattern || ''}
                      onValueChange={(v: typeof usage.weekendUsagePattern) => 
                        onChange({ ...value, usage: { ...usage, weekendUsagePattern: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="higher">Higher than weekdays</SelectItem>
                        <SelectItem value="same">About the same</SelectItem>
                        <SelectItem value="lower">Lower than weekdays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Work From Home Days</Label>
                    <Select
                      value={usage.workFromHomeDays?.toString() || '0'}
                      onValueChange={(v) => 
                        onChange({ 
                          ...value, 
                          usage: { 
                            ...usage, 
                            workFromHome: parseInt(v) > 0,
                            workFromHomeDays: parseInt(v) 
                          } 
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None / Away during day</SelectItem>
                        <SelectItem value="1">1 day/week</SelectItem>
                        <SelectItem value="2">2 days/week</SelectItem>
                        <SelectItem value="3">3 days/week</SelectItem>
                        <SelectItem value="5">Full time WFH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pool-pump"
                      checked={usage.poolPumpUsage || false}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, usage: { ...usage, poolPumpUsage: checked as boolean } })
                      }
                    />
                    <Label htmlFor="pool-pump">Pool Pump</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hot-tub"
                      checked={usage.hotTubUsage || false}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, usage: { ...usage, hotTubUsage: checked as boolean } })
                      }
                    />
                    <Label htmlFor="hot-tub">Hot Tub/Spa</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Equipment */}
      <Collapsible open={expandedSections.equipment} onOpenChange={() => toggleSection('equipment')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <Thermometer className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Equipment & Efficiency</CardTitle>
                    <CardDescription>Appliances and energy efficiency features</CardDescription>
                  </div>
                </div>
                {expandedSections.equipment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Heating Type</Label>
                  <Select
                    value={equipment.heatingType || ''}
                    onValueChange={(v: typeof equipment.heatingType) => 
                      onChange({ ...value, equipment: { ...equipment, heatingType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electric_furnace">Electric Furnace</SelectItem>
                      <SelectItem value="heat_pump">Heat Pump</SelectItem>
                      <SelectItem value="baseboard">Electric Baseboard</SelectItem>
                      <SelectItem value="gas">Gas (not electric)</SelectItem>
                      <SelectItem value="oil">Oil (not electric)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cooling Type</Label>
                  <Select
                    value={equipment.coolingType || ''}
                    onValueChange={(v: typeof equipment.coolingType) => 
                      onChange({ ...value, equipment: { ...equipment, coolingType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central_ac">Central A/C</SelectItem>
                      <SelectItem value="window_units">Window Units</SelectItem>
                      <SelectItem value="mini_split">Mini-Split</SelectItem>
                      <SelectItem value="evaporative">Evaporative Cooler</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Water Heater</Label>
                  <Select
                    value={equipment.waterHeaterType || ''}
                    onValueChange={(v: typeof equipment.waterHeaterType) => 
                      onChange({ ...value, equipment: { ...equipment, waterHeaterType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electric">Electric Tank</SelectItem>
                      <SelectItem value="gas">Gas (not electric)</SelectItem>
                      <SelectItem value="tankless_electric">Tankless Electric</SelectItem>
                      <SelectItem value="heat_pump">Heat Pump</SelectItem>
                      <SelectItem value="solar">Solar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Window Type</Label>
                  <Select
                    value={equipment.windowType || ''}
                    onValueChange={(v: typeof equipment.windowType) => 
                      onChange({ ...value, equipment: { ...equipment, windowType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_pane">Single Pane</SelectItem>
                      <SelectItem value="double_pane">Double Pane</SelectItem>
                      <SelectItem value="triple_pane">Triple Pane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Energy Efficiency */}
              <div className="space-y-4">
                <h4 className="font-medium">Energy Efficiency Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smart-thermo"
                      checked={equipment.smartThermostat || false}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, equipment: { ...equipment, smartThermostat: checked as boolean } })
                      }
                    />
                    <Label htmlFor="smart-thermo">Smart Thermostat</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="led"
                      checked={equipment.ledLighting || false}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, equipment: { ...equipment, ledLighting: checked as boolean } })
                      }
                    />
                    <Label htmlFor="led">LED Lighting (Most lights)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Energy Star Appliances</Label>
                    <Select
                      value={equipment.energyStarAppliances?.toString() || '0'}
                      onValueChange={(v) => 
                        onChange({ ...value, equipment: { ...equipment, energyStarAppliances: parseInt(v) } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1-2</SelectItem>
                        <SelectItem value="3">3-4</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* EV & Solar */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-green-500" />
                  <h4 className="font-medium">Electric Vehicle & Solar</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ev"
                      checked={equipment.electricVehicle || false}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, equipment: { ...equipment, electricVehicle: checked as boolean } })
                      }
                    />
                    <Label htmlFor="ev">Electric Vehicle</Label>
                  </div>
                  {equipment.electricVehicle && (
                    <div className="space-y-2">
                      <Label>EV Charger Level</Label>
                      <Select
                        value={equipment.evChargingLevel?.toString() || ''}
                        onValueChange={(v) => 
                          onChange({ ...value, equipment: { ...equipment, evChargingLevel: parseInt(v) as 1 | 2 | 3 } })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Level 1 (120V)</SelectItem>
                          <SelectItem value="2">Level 2 (240V)</SelectItem>
                          <SelectItem value="3">Level 3 (DC Fast)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="solar"
                      checked={equipment.solarPanels || false}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, equipment: { ...equipment, solarPanels: checked as boolean } })
                      }
                    />
                    <Label htmlFor="solar">Solar Panels</Label>
                  </div>
                  {equipment.solarPanels && (
                    <div className="space-y-2">
                      <Label>Solar Capacity (kW)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 6"
                        value={equipment.solarCapacityKw || ''}
                        onChange={(e) => 
                          onChange({ ...value, equipment: { ...equipment, solarCapacityKw: parseFloat(e.target.value) || undefined } })
                        }
                      />
                    </div>
                  )}
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
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Plan Preferences</CardTitle>
                    <CardDescription>What matters most to you</CardDescription>
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
                  <Label>Plan Type</Label>
                  <Select
                    value={preferences.planType || 'any'}
                    onValueChange={(v: typeof preferences.planType) => 
                      onChange({ ...value, preferences: { ...preferences, planType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_rate">Fixed Rate</SelectItem>
                      <SelectItem value="variable_rate">Variable Rate</SelectItem>
                      <SelectItem value="indexed">Indexed</SelectItem>
                      <SelectItem value="time_of_use">Time of Use</SelectItem>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="any">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contract Length</Label>
                  <Select
                    value={preferences.contractLength || 'no_preference'}
                    onValueChange={(v: typeof preferences.contractLength) => 
                      onChange({ ...value, preferences: { ...preferences, contractLength: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month_to_month">Month to Month</SelectItem>
                      <SelectItem value="6_months">6 Months</SelectItem>
                      <SelectItem value="12_months">12 Months</SelectItem>
                      <SelectItem value="24_months">24 Months</SelectItem>
                      <SelectItem value="36_months">36 Months</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Renewable Energy</Label>
                  <Select
                    value={preferences.renewableEnergy || 'no_preference'}
                    onValueChange={(v: typeof preferences.renewableEnergy) => 
                      onChange({ ...value, preferences: { ...preferences, renewableEnergy: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">100% Required</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Monthly Budget</Label>
                  <Input
                    type="number"
                    placeholder="$ (optional)"
                    value={preferences.maxMonthlyBudget || ''}
                    onChange={(e) => 
                      onChange({ ...value, preferences: { ...preferences, maxMonthlyBudget: parseInt(e.target.value) || undefined } })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="budget-billing"
                  checked={preferences.budgetBilling || false}
                  onCheckedChange={(checked) => 
                    onChange({ ...value, preferences: { ...preferences, budgetBilling: checked as boolean } })
                  }
                />
                <Label htmlFor="budget-billing">Interested in Budget Billing (fixed monthly payment)</Label>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Current Service */}
      <Collapsible open={expandedSections.current} onOpenChange={() => toggleSection('current')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Zap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Current Service (Optional)</CardTitle>
                    <CardDescription>Help us show potential savings</CardDescription>
                  </div>
                </div>
                {expandedSections.current ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Current Provider</Label>
                  <Input
                    placeholder="Provider name"
                    value={value.currentService?.provider || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentService: { ...value.currentService, provider: e.target.value } as typeof value.currentService 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Average Monthly Bill</Label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={value.currentService?.averageMonthlyBill || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentService: { ...value.currentService, averageMonthlyBill: parseInt(e.target.value) || 0 } as typeof value.currentService 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate per kWh</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="$ (e.g., 0.12)"
                    value={value.currentService?.ratePerKwh || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentService: { ...value.currentService, ratePerKwh: parseFloat(e.target.value) || 0 } as typeof value.currentService 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract End Date</Label>
                  <Input
                    type="date"
                    value={value.currentService?.contractEndDate || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentService: { ...value.currentService, contractEndDate: e.target.value } as typeof value.currentService 
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// GAS UTILITY INPUTS
// ============================================================================

interface GasUtilityInputsFormProps {
  value: Partial<GasUtilityInputs>;
  onChange: (value: Partial<GasUtilityInputs>) => void;
}

export function GasUtilityInputsForm({ value, onChange }: GasUtilityInputsFormProps) {
  const property = value.property || {} as UtilityPropertyInfo;
  const usage = value.usage || {
    monthlyUsageTherms: {
      january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
      july: 0, august: 0, september: 0, october: 0, november: 0, december: 0
    },
    primaryGasUses: []
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Gas Utility Information</CardTitle>
              <CardDescription>Natural gas usage and preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                placeholder="12345"
                maxLength={5}
                value={property.zipCode || ''}
                onChange={(e) => onChange({ ...value, property: { ...property, zipCode: e.target.value } as UtilityPropertyInfo })}
              />
            </div>
            <div className="space-y-2">
              <Label>Square Footage</Label>
              <Input
                type="number"
                placeholder="e.g., 2000"
                value={property.squareFootage || ''}
                onChange={(e) => onChange({ ...value, property: { ...property, squareFootage: parseInt(e.target.value) } as UtilityPropertyInfo })}
              />
            </div>
            <div className="space-y-2">
              <Label># of Occupants</Label>
              <Select
                value={property.occupants?.toString() || ''}
                onValueChange={(v) => onChange({ ...value, property: { ...property, occupants: parseInt(v) } as UtilityPropertyInfo })}
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
          </div>

          {/* Primary Gas Uses */}
          <div className="space-y-4">
            <Label>Primary Gas Uses (Select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'heating', label: 'Home Heating' },
                { id: 'water_heating', label: 'Water Heater' },
                { id: 'cooking', label: 'Cooking (Stove/Oven)' },
                { id: 'dryer', label: 'Gas Dryer' },
                { id: 'pool_heater', label: 'Pool/Spa Heater' },
                { id: 'fireplace', label: 'Gas Fireplace' },
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`gas-${item.id}`}
                    checked={usage.primaryGasUses?.includes(item.id as any) || false}
                    onCheckedChange={(checked) => {
                      const uses = usage.primaryGasUses || [];
                      if (checked) {
                        onChange({ ...value, usage: { ...usage, primaryGasUses: [...uses, item.id as any] } });
                      } else {
                        onChange({ ...value, usage: { ...usage, primaryGasUses: uses.filter(u => u !== item.id) } });
                      }
                    }}
                  />
                  <Label htmlFor={`gas-${item.id}`}>{item.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Usage */}
          <div className="space-y-4">
            <h4 className="font-medium">Monthly Usage (Therms) - From your gas bill</h4>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {MONTHS.map((month, idx) => (
                <div key={month} className="space-y-1">
                  <Label className="text-xs">{MONTH_LABELS[idx]}</Label>
                  <Input
                    type="number"
                    placeholder="Therms"
                    className="h-9"
                    value={usage.monthlyUsageTherms?.[month] || ''}
                    onChange={(e) => {
                      onChange({
                        ...value,
                        usage: {
                          ...usage,
                          monthlyUsageTherms: {
                            ...usage.monthlyUsageTherms,
                            [month]: parseInt(e.target.value) || 0
                          }
                        }
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// WATER UTILITY INPUTS
// ============================================================================

interface WaterUtilityInputsFormProps {
  value: Partial<WaterUtilityInputs>;
  onChange: (value: Partial<WaterUtilityInputs>) => void;
}

export function WaterUtilityInputsForm({ value, onChange }: WaterUtilityInputsFormProps) {
  const property = value.property || {} as UtilityPropertyInfo;
  const usage = value.usage || {
    monthlyUsageGallons: 0,
    irrigationUsage: false,
    irrigationType: 'none',
    smartIrrigation: false,
    hotTub: false,
    lowFlowFixtures: false,
    highEfficiencyAppliances: false,
    rainwaterHarvesting: false,
    grayWaterSystem: false
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
              <Droplets className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Water Utility Information</CardTitle>
              <CardDescription>Water usage and conservation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                placeholder="12345"
                maxLength={5}
                value={property.zipCode || ''}
                onChange={(e) => onChange({ ...value, property: { ...property, zipCode: e.target.value } as UtilityPropertyInfo })}
              />
            </div>
            <div className="space-y-2">
              <Label># of Occupants</Label>
              <Select
                value={property.occupants?.toString() || ''}
                onValueChange={(v) => onChange({ ...value, property: { ...property, occupants: parseInt(v) } as UtilityPropertyInfo })}
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
              <Label>Avg Monthly Gallons</Label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={usage.monthlyUsageGallons || ''}
                onChange={(e) => onChange({ ...value, usage: { ...usage, monthlyUsageGallons: parseInt(e.target.value) || 0 } })}
              />
            </div>
          </div>

          {/* Irrigation */}
          <div className="space-y-4">
            <h4 className="font-medium">Outdoor Water Use</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="irrigation"
                  checked={usage.irrigationUsage || false}
                  onCheckedChange={(checked) => onChange({ ...value, usage: { ...usage, irrigationUsage: checked as boolean } })}
                />
                <Label htmlFor="irrigation">Lawn/Garden Irrigation</Label>
              </div>
              {usage.irrigationUsage && (
                <>
                  <div className="space-y-2">
                    <Label>Irrigation Type</Label>
                    <Select
                      value={usage.irrigationType || 'sprinkler'}
                      onValueChange={(v: typeof usage.irrigationType) => onChange({ ...value, usage: { ...usage, irrigationType: v } })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sprinkler">Sprinkler</SelectItem>
                        <SelectItem value="drip">Drip System</SelectItem>
                        <SelectItem value="manual">Manual/Hose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smart-irrigation"
                      checked={usage.smartIrrigation || false}
                      onCheckedChange={(checked) => onChange({ ...value, usage: { ...usage, smartIrrigation: checked as boolean } })}
                    />
                    <Label htmlFor="smart-irrigation">Smart Controller</Label>
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hottub"
                  checked={usage.hotTub || false}
                  onCheckedChange={(checked) => onChange({ ...value, usage: { ...usage, hotTub: checked as boolean } })}
                />
                <Label htmlFor="hottub">Hot Tub/Pool</Label>
              </div>
            </div>
          </div>

          {/* Conservation */}
          <div className="space-y-4">
            <h4 className="font-medium">Water Conservation Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'low-flow', label: 'Low-Flow Fixtures', key: 'lowFlowFixtures' },
                { id: 'efficient', label: 'High-Efficiency Appliances', key: 'highEfficiencyAppliances' },
                { id: 'rainwater', label: 'Rainwater Harvesting', key: 'rainwaterHarvesting' },
                { id: 'graywater', label: 'Graywater System', key: 'grayWaterSystem' },
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={usage[item.key as keyof typeof usage] as boolean || false}
                    onCheckedChange={(checked) => onChange({ ...value, usage: { ...usage, [item.key]: checked as boolean } })}
                  />
                  <Label htmlFor={item.id}>{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ElectricUtilityInputsForm;
















