'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Wifi, 
  Smartphone,
  Home,
  Users,
  Tv,
  Gamepad2,
  Video,
  Monitor,
  Plus,
  Trash2,
  Signal,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { InternetServiceInputs, MobileServiceInputs, MobileLineInfo } from '@/types/service-comparator-inputs';

// ============================================================================
// INTERNET SERVICE INPUTS
// ============================================================================

interface InternetServiceInputsFormProps {
  value: Partial<InternetServiceInputs>;
  onChange: (value: Partial<InternetServiceInputs>) => void;
}

export function InternetServiceInputsForm({ value, onChange }: InternetServiceInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    property: true,
    usage: true,
    requirements: false,
    preferences: false,
    current: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const property = value.property || {
    address: '',
    zipCode: '',
    propertyType: 'single_family',
    homeOwnership: 'own',
    buildingMdu: false
  };
  const usage = value.usage || {
    householdMembers: 2,
    simultaneousUsers: 2,
    workFromHome: 0,
    onlineStudents: 0,
    usageTypes: {
      streaming4k: 'occasional',
      gaming: 'none',
      videoConferencing: 'occasional',
      largeFileTransfers: 'none',
      smartHome: 'basic',
      securityCameras: 0
    },
    connectedDevices: {
      computers: 2,
      smartphones: 2,
      tablets: 1,
      smartTVs: 1,
      gamingConsoles: 0,
      iotDevices: 0,
      securityCameras: 0
    },
    estimatedMonthlyDataGB: 300
  };
  const requirements = value.requirements || {
    minimumDownloadMbps: 100,
    minimumUploadMbps: 10,
    latencyImportance: 'moderate',
    reliabilityImportance: 'important',
    preferredConnectionType: 'any',
    dataCap: 'unlimited_preferred'
  };
  const preferences = value.preferences || {
    contractLength: 'no_preference',
    bundleOptions: [],
    equipmentPreference: 'no_preference',
    wifiExtenders: false,
    meshNetwork: false,
    features: {
      staticIp: false,
      noDataCap: true,
      freeModem: false,
      freeInstallation: false,
      priceGuarantee: false,
      wholehomeWifi: false,
      securitySuite: false,
      parentalControls: false
    },
    maxMonthlyBudget: 100,
    providerPreferences: {
      majorProviderOnly: false,
      localProviderPreferred: false,
      avoidProviders: []
    }
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
                    <CardTitle className="text-lg">Service Location</CardTitle>
                    <CardDescription>Where do you need internet service?</CardDescription>
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
                    placeholder="123 Main Street"
                    value={property.address || ''}
                    onChange={(e) => onChange({ ...value, property: { ...property, address: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code *</Label>
                  <Input
                    placeholder="12345"
                    maxLength={5}
                    value={property.zipCode || ''}
                    onChange={(e) => onChange({ ...value, property: { ...property, zipCode: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select
                    value={property.propertyType || 'single_family'}
                    onValueChange={(v: typeof property.propertyType) => onChange({ ...value, property: { ...property, propertyType: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family Home</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mdu"
                  checked={property.buildingMdu || false}
                  onCheckedChange={(checked) => onChange({ ...value, property: { ...property, buildingMdu: checked as boolean } })}
                />
                <Label htmlFor="mdu">Building has existing internet infrastructure/wiring</Label>
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
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Household & Usage</CardTitle>
                    <CardDescription>How will you use the internet?</CardDescription>
                  </div>
                </div>
                {expandedSections.usage ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Household */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Household Members</Label>
                  <Select
                    value={usage.householdMembers?.toString() || '2'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, householdMembers: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Simultaneous Users</Label>
                  <Select
                    value={usage.simultaneousUsers?.toString() || '2'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, simultaneousUsers: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work From Home</Label>
                  <Select
                    value={usage.workFromHome?.toString() || '0'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, workFromHome: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">1 person</SelectItem>
                      <SelectItem value="2">2 people</SelectItem>
                      <SelectItem value="3">3+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Online Students</Label>
                  <Select
                    value={usage.onlineStudents?.toString() || '0'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, onlineStudents: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">1 student</SelectItem>
                      <SelectItem value="2">2 students</SelectItem>
                      <SelectItem value="3">3+ students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Usage Types */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Tv className="h-4 w-4" /> Activity Usage
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-red-500" /> 4K Streaming
                    </Label>
                    <Select
                      value={usage.usageTypes?.streaming4k || 'occasional'}
                      onValueChange={(v: typeof usage.usageTypes.streaming4k) => 
                        onChange({ ...value, usage: { ...usage, usageTypes: { ...usage.usageTypes, streaming4k: v } } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="occasional">Occasional</SelectItem>
                        <SelectItem value="frequent">Frequent (daily)</SelectItem>
                        <SelectItem value="constant">Constant (multiple streams)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-green-500" /> Gaming
                    </Label>
                    <Select
                      value={usage.usageTypes?.gaming || 'none'}
                      onValueChange={(v: typeof usage.usageTypes.gaming) => 
                        onChange({ ...value, usage: { ...usage, usageTypes: { ...usage.usageTypes, gaming: v } } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="competitive">Competitive/Online</SelectItem>
                        <SelectItem value="professional">Pro/Streaming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-500" /> Video Calls
                    </Label>
                    <Select
                      value={usage.usageTypes?.videoConferencing || 'occasional'}
                      onValueChange={(v: typeof usage.usageTypes.videoConferencing) => 
                        onChange({ ...value, usage: { ...usage, usageTypes: { ...usage.usageTypes, videoConferencing: v } } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="occasional">Occasional</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="constant">All day (multiple calls)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Connected Devices */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Connected Devices
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                  {[
                    { key: 'computers', label: 'Computers' },
                    { key: 'smartphones', label: 'Phones' },
                    { key: 'tablets', label: 'Tablets' },
                    { key: 'smartTVs', label: 'Smart TVs' },
                    { key: 'gamingConsoles', label: 'Consoles' },
                    { key: 'iotDevices', label: 'IoT/Smart' },
                    { key: 'securityCameras', label: 'Cameras' },
                  ].map(device => (
                    <div key={device.key} className="space-y-1">
                      <Label className="text-xs">{device.label}</Label>
                      <Select
                        value={usage.connectedDevices?.[device.key as keyof typeof usage.connectedDevices]?.toString() || '0'}
                        onValueChange={(v) => 
                          onChange({ 
                            ...value, 
                            usage: { 
                              ...usage, 
                              connectedDevices: { 
                                ...usage.connectedDevices, 
                                [device.key]: parseInt(v) 
                              } 
                            } 
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Requirements */}
      <Collapsible open={expandedSections.requirements} onOpenChange={() => toggleSection('requirements')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Signal className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Speed & Requirements</CardTitle>
                    <CardDescription>What do you need from your connection?</CardDescription>
                  </div>
                </div>
                {expandedSections.requirements ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Min Download Speed</Label>
                  <Select
                    value={requirements.minimumDownloadMbps?.toString() || '100'}
                    onValueChange={(v) => onChange({ ...value, requirements: { ...requirements, minimumDownloadMbps: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 Mbps (Basic)</SelectItem>
                      <SelectItem value="50">50 Mbps</SelectItem>
                      <SelectItem value="100">100 Mbps</SelectItem>
                      <SelectItem value="200">200 Mbps</SelectItem>
                      <SelectItem value="300">300 Mbps</SelectItem>
                      <SelectItem value="500">500 Mbps</SelectItem>
                      <SelectItem value="1000">1 Gbps (Gigabit)</SelectItem>
                      <SelectItem value="2000">2 Gbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min Upload Speed</Label>
                  <Select
                    value={requirements.minimumUploadMbps?.toString() || '10'}
                    onValueChange={(v) => onChange({ ...value, requirements: { ...requirements, minimumUploadMbps: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Mbps (Basic)</SelectItem>
                      <SelectItem value="10">10 Mbps</SelectItem>
                      <SelectItem value="20">20 Mbps</SelectItem>
                      <SelectItem value="50">50 Mbps</SelectItem>
                      <SelectItem value="100">100 Mbps</SelectItem>
                      <SelectItem value="500">500 Mbps</SelectItem>
                      <SelectItem value="1000">1 Gbps (Symmetric)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Select
                    value={requirements.preferredConnectionType || 'any'}
                    onValueChange={(v: typeof requirements.preferredConnectionType) => 
                      onChange({ ...value, requirements: { ...requirements, preferredConnectionType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiber">Fiber (Fastest)</SelectItem>
                      <SelectItem value="cable">Cable</SelectItem>
                      <SelectItem value="dsl">DSL</SelectItem>
                      <SelectItem value="fixed_wireless">Fixed Wireless</SelectItem>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="any">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Cap</Label>
                  <Select
                    value={requirements.dataCap || 'unlimited_preferred'}
                    onValueChange={(v: typeof requirements.dataCap) => 
                      onChange({ ...value, requirements: { ...requirements, dataCap: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited_required">Unlimited Required</SelectItem>
                      <SelectItem value="unlimited_preferred">Unlimited Preferred</SelectItem>
                      <SelectItem value="acceptable">Data Cap OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latency Importance</Label>
                  <Select
                    value={requirements.latencyImportance || 'moderate'}
                    onValueChange={(v: typeof requirements.latencyImportance) => 
                      onChange({ ...value, requirements: { ...requirements, latencyImportance: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical (Gaming/Trading)</SelectItem>
                      <SelectItem value="important">Important (Video Calls)</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="not_important">Not Important</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reliability Importance</Label>
                  <Select
                    value={requirements.reliabilityImportance || 'important'}
                    onValueChange={(v: typeof requirements.reliabilityImportance) => 
                      onChange({ ...value, requirements: { ...requirements, reliabilityImportance: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical (Work from home)</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="not_important">Not Important</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <Wifi className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Plan Preferences</CardTitle>
                    <CardDescription>Contract, features, and budget</CardDescription>
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
                      <SelectItem value="12_months">12 Months</SelectItem>
                      <SelectItem value="24_months">24 Months</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select
                    value={preferences.equipmentPreference || 'no_preference'}
                    onValueChange={(v: typeof preferences.equipmentPreference) => 
                      onChange({ ...value, preferences: { ...preferences, equipmentPreference: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">Rent Equipment</SelectItem>
                      <SelectItem value="own">Use Own Equipment</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Monthly Budget</Label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={preferences.maxMonthlyBudget || ''}
                    onChange={(e) => onChange({ ...value, preferences: { ...preferences, maxMonthlyBudget: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>

              {/* Bundle Options */}
              <div className="space-y-2">
                <Label>Interested in Bundling?</Label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'tv', label: 'TV Service' },
                    { id: 'phone', label: 'Home Phone' },
                    { id: 'mobile', label: 'Mobile Phone' },
                    { id: 'security', label: 'Home Security' },
                  ].map(bundle => (
                    <div key={bundle.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bundle-${bundle.id}`}
                        checked={preferences.bundleOptions?.includes(bundle.id as any) || false}
                        onCheckedChange={(checked) => {
                          const options = preferences.bundleOptions || [];
                          if (checked) {
                            onChange({ ...value, preferences: { ...preferences, bundleOptions: [...options, bundle.id as any] } });
                          } else {
                            onChange({ ...value, preferences: { ...preferences, bundleOptions: options.filter(o => o !== bundle.id) } });
                          }
                        }}
                      />
                      <Label htmlFor={`bundle-${bundle.id}`}>{bundle.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Important Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'noDataCap', label: 'No Data Cap' },
                    { key: 'freeModem', label: 'Free Modem/Router' },
                    { key: 'freeInstallation', label: 'Free Installation' },
                    { key: 'priceGuarantee', label: 'Price Lock Guarantee' },
                    { key: 'wholehomeWifi', label: 'Whole-Home WiFi' },
                    { key: 'securitySuite', label: 'Security Suite' },
                    { key: 'parentalControls', label: 'Parental Controls' },
                    { key: 'staticIp', label: 'Static IP Address' },
                  ].map(feature => (
                    <div key={feature.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.key}
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
                      <Label htmlFor={feature.key}>{feature.label}</Label>
                    </div>
                  ))}
                </div>
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
                    <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
                    placeholder="e.g., Comcast, AT&T"
                    value={value.currentService?.provider || ''}
                    onChange={(e) => onChange({ ...value, currentService: { ...value.currentService, provider: e.target.value } as typeof value.currentService })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Download Speed (Mbps)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={value.currentService?.downloadSpeed || ''}
                    onChange={(e) => onChange({ ...value, currentService: { ...value.currentService, downloadSpeed: parseInt(e.target.value) || 0 } as typeof value.currentService })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Price</Label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={value.currentService?.monthlyPrice || ''}
                    onChange={(e) => onChange({ ...value, currentService: { ...value.currentService, monthlyPrice: parseInt(e.target.value) || 0 } as typeof value.currentService })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract End Date</Label>
                  <Input
                    type="date"
                    value={value.currentService?.contractEndDate || ''}
                    onChange={(e) => onChange({ ...value, currentService: { ...value.currentService, contractEndDate: e.target.value } as typeof value.currentService })}
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
// MOBILE SERVICE INPUTS
// ============================================================================

interface MobileServiceInputsFormProps {
  value: Partial<MobileServiceInputs>;
  onChange: (value: Partial<MobileServiceInputs>) => void;
}

export function MobileServiceInputsForm({ value, onChange }: MobileServiceInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    lines: true,
    usage: true,
    requirements: false,
    preferences: false,
    current: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const lines = value.lines || [];
  const usage = value.usage || {
    dataUsageGB: { total: 10, perLine: [] },
    callMinutes: { domestic: 500, international: 0 },
    textMessages: 1000,
    hotspotUsage: false,
    streamingOnMobile: 'occasional',
    internationalTravel: 'never'
  };
  const requirements = value.requirements || {
    networkCoverage: { homeZip: '', frequentAreas: [], ruralCoverage: false },
    networkPriority: 'no_preference',
    dataNeeds: 'unlimited_preferred',
    familyPlan: false,
    numberOfLines: 1
  };
  const preferences = value.preferences || {
    carrierType: 'any',
    contractType: 'no_preference',
    features: {
      hotspot: false,
      internationalRoaming: false,
      streamingPerks: false,
      insuranceProtection: false,
      premiumData: false,
      canadaMexicoIncluded: false,
      wifiCalling: false,
      numberPorting: true
    },
    devicePayment: 'no_preference',
    tradeInDevices: false,
    maxMonthlyBudget: 100,
    avoidCarriers: []
  };

  const addLine = () => {
    const newLine: MobileLineInfo = {
      userType: 'adult',
      deviceType: 'smartphone',
      needNewDevice: false,
      upgradeImportance: 'not_important'
    };
    onChange({ ...value, lines: [...lines, newLine] });
  };

  const updateLine = (index: number, updates: Partial<MobileLineInfo>) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], ...updates };
    onChange({ ...value, lines: newLines });
  };

  const removeLine = (index: number) => {
    onChange({ ...value, lines: lines.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Lines */}
      <Collapsible open={expandedSections.lines} onOpenChange={() => toggleSection('lines')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Phone Lines</CardTitle>
                    <CardDescription>Add all lines you need</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lines.length} line(s)</Badge>
                  {expandedSections.lines ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {lines.map((line, index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Line {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeLine(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>User Type</Label>
                        <Select
                          value={line.userType || 'adult'}
                          onValueChange={(v: MobileLineInfo['userType']) => updateLine(index, { userType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adult">Adult</SelectItem>
                            <SelectItem value="teen">Teen (13-17)</SelectItem>
                            <SelectItem value="child">Child (under 13)</SelectItem>
                            <SelectItem value="senior">Senior (55+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Device Type</Label>
                        <Select
                          value={line.deviceType || 'smartphone'}
                          onValueChange={(v: MobileLineInfo['deviceType']) => updateLine(index, { deviceType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smartphone">Smartphone</SelectItem>
                            <SelectItem value="basic_phone">Basic Phone</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="smartwatch">Smartwatch</SelectItem>
                            <SelectItem value="hotspot">Mobile Hotspot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 flex flex-col justify-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`newdevice-${index}`}
                            checked={line.needNewDevice || false}
                            onCheckedChange={(checked) => updateLine(index, { needNewDevice: checked as boolean })}
                          />
                          <Label htmlFor={`newdevice-${index}`}>Need New Device</Label>
                        </div>
                      </div>
                      {line.needNewDevice && (
                        <div className="space-y-2">
                          <Label>Device Preference</Label>
                          <Input
                            placeholder="e.g., iPhone 15 Pro"
                            value={line.devicePreference || ''}
                            onChange={(e) => updateLine(index, { devicePreference: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Usage */}
      <Collapsible open={expandedSections.usage} onOpenChange={() => toggleSection('usage')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Signal className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Usage Information</CardTitle>
                    <CardDescription>How much data, calls, and texts do you use?</CardDescription>
                  </div>
                </div>
                {expandedSections.usage ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Total Data (GB/month)</Label>
                  <Select
                    value={usage.dataUsageGB?.total?.toString() || '10'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, dataUsageGB: { ...usage.dataUsageGB, total: parseInt(v) } } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 GB or less</SelectItem>
                      <SelectItem value="3">3 GB</SelectItem>
                      <SelectItem value="5">5 GB</SelectItem>
                      <SelectItem value="10">10 GB</SelectItem>
                      <SelectItem value="15">15 GB</SelectItem>
                      <SelectItem value="25">25 GB</SelectItem>
                      <SelectItem value="50">50 GB</SelectItem>
                      <SelectItem value="100">100+ GB (Unlimited)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Domestic Call Minutes</Label>
                  <Select
                    value={usage.callMinutes?.domestic?.toString() || '500'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, callMinutes: { ...usage.callMinutes, domestic: parseInt(v) } } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Under 100 min</SelectItem>
                      <SelectItem value="300">100-300 min</SelectItem>
                      <SelectItem value="500">300-500 min</SelectItem>
                      <SelectItem value="1000">500+ min (Unlimited)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Text Messages</Label>
                  <Select
                    value={usage.textMessages?.toString() || '1000'}
                    onValueChange={(v) => onChange({ ...value, usage: { ...usage, textMessages: parseInt(v) } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Under 100</SelectItem>
                      <SelectItem value="500">100-500</SelectItem>
                      <SelectItem value="1000">500+ (Unlimited)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Streaming</Label>
                  <Select
                    value={usage.streamingOnMobile || 'occasional'}
                    onValueChange={(v: typeof usage.streamingOnMobile) => onChange({ ...value, usage: { ...usage, streamingOnMobile: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="occasional">Occasional</SelectItem>
                      <SelectItem value="frequent">Frequent</SelectItem>
                      <SelectItem value="constant">Constant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hotspot"
                    checked={usage.hotspotUsage || false}
                    onCheckedChange={(checked) => onChange({ ...value, usage: { ...usage, hotspotUsage: checked as boolean } })}
                  />
                  <Label htmlFor="hotspot">Mobile Hotspot Needed</Label>
                </div>
                <div className="space-y-2">
                  <Label>International Travel</Label>
                  <Select
                    value={usage.internationalTravel || 'never'}
                    onValueChange={(v: typeof usage.internationalTravel) => onChange({ ...value, usage: { ...usage, internationalTravel: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="rarely">Rarely (1-2x/year)</SelectItem>
                      <SelectItem value="occasionally">Occasionally (3-5x/year)</SelectItem>
                      <SelectItem value="frequently">Frequently (6+/year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Requirements */}
      <Collapsible open={expandedSections.requirements} onOpenChange={() => toggleSection('requirements')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Signal className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Coverage Requirements</CardTitle>
                    <CardDescription>Where do you need coverage?</CardDescription>
                  </div>
                </div>
                {expandedSections.requirements ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Home ZIP Code *</Label>
                  <Input
                    placeholder="12345"
                    maxLength={5}
                    value={requirements.networkCoverage?.homeZip || ''}
                    onChange={(e) => onChange({ 
                      ...value, 
                      requirements: { 
                        ...requirements, 
                        networkCoverage: { ...requirements.networkCoverage, homeZip: e.target.value } 
                      } 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work ZIP (Optional)</Label>
                  <Input
                    placeholder="12345"
                    maxLength={5}
                    value={requirements.networkCoverage?.workZip || ''}
                    onChange={(e) => onChange({ 
                      ...value, 
                      requirements: { 
                        ...requirements, 
                        networkCoverage: { ...requirements.networkCoverage, workZip: e.target.value } 
                      } 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Network Priority</Label>
                  <Select
                    value={requirements.networkPriority || 'no_preference'}
                    onValueChange={(v: typeof requirements.networkPriority) => 
                      onChange({ ...value, requirements: { ...requirements, networkPriority: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5g_essential">5G Essential</SelectItem>
                      <SelectItem value="5g_preferred">5G Preferred</SelectItem>
                      <SelectItem value="4g_acceptable">4G LTE OK</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Needs</Label>
                  <Select
                    value={requirements.dataNeeds || 'unlimited_preferred'}
                    onValueChange={(v: typeof requirements.dataNeeds) => 
                      onChange({ ...value, requirements: { ...requirements, dataNeeds: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited_required">Unlimited Required</SelectItem>
                      <SelectItem value="unlimited_preferred">Unlimited Preferred</SelectItem>
                      <SelectItem value="limited_acceptable">Limited OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rural"
                  checked={requirements.networkCoverage?.ruralCoverage || false}
                  onCheckedChange={(checked) => onChange({ 
                    ...value, 
                    requirements: { 
                      ...requirements, 
                      networkCoverage: { ...requirements.networkCoverage, ruralCoverage: checked as boolean } 
                    } 
                  })}
                />
                <Label htmlFor="rural">Need strong rural/remote area coverage</Label>
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
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Plan Preferences</CardTitle>
                    <CardDescription>Carrier type, features, and budget</CardDescription>
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
                  <Label>Carrier Type</Label>
                  <Select
                    value={preferences.carrierType || 'any'}
                    onValueChange={(v: typeof preferences.carrierType) => 
                      onChange({ ...value, preferences: { ...preferences, carrierType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="major">Major Carrier Only</SelectItem>
                      <SelectItem value="mvno">MVNO (Budget)</SelectItem>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select
                    value={preferences.contractType || 'no_preference'}
                    onValueChange={(v: typeof preferences.contractType) => 
                      onChange({ ...value, preferences: { ...preferences, contractType: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postpaid">Postpaid</SelectItem>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Device Payment</Label>
                  <Select
                    value={preferences.devicePayment || 'no_preference'}
                    onValueChange={(v: typeof preferences.devicePayment) => 
                      onChange({ ...value, preferences: { ...preferences, devicePayment: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upfront">Pay Upfront</SelectItem>
                      <SelectItem value="installment">Monthly Installments</SelectItem>
                      <SelectItem value="lease">Lease/Upgrade Program</SelectItem>
                      <SelectItem value="no_preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Monthly Budget</Label>
                  <Input
                    type="number"
                    placeholder="$ total for all lines"
                    value={preferences.maxMonthlyBudget || ''}
                    onChange={(e) => onChange({ ...value, preferences: { ...preferences, maxMonthlyBudget: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Important Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'hotspot', label: 'Mobile Hotspot' },
                    { key: 'internationalRoaming', label: 'International Roaming' },
                    { key: 'streamingPerks', label: 'Streaming Perks (Netflix, etc)' },
                    { key: 'insuranceProtection', label: 'Device Protection' },
                    { key: 'premiumData', label: 'Premium/Priority Data' },
                    { key: 'canadaMexicoIncluded', label: 'Canada/Mexico Included' },
                    { key: 'wifiCalling', label: 'WiFi Calling' },
                    { key: 'numberPorting', label: 'Keep Current Number' },
                  ].map(feature => (
                    <div key={feature.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mobile-${feature.key}`}
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
                      <Label htmlFor={`mobile-${feature.key}`}>{feature.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tradein"
                  checked={preferences.tradeInDevices || false}
                  onCheckedChange={(checked) => onChange({ ...value, preferences: { ...preferences, tradeInDevices: checked as boolean } })}
                />
                <Label htmlFor="tradein">Have devices to trade in</Label>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export default InternetServiceInputsForm;





















