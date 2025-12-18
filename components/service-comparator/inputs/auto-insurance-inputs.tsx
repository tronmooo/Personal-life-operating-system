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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  User, 
  Shield, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { AutoInsuranceInputs, VehicleInfo, DriverInfo, AccidentRecord, ViolationRecord } from '@/types/service-comparator-inputs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AutoInsuranceInputsFormProps {
  value: Partial<AutoInsuranceInputs>;
  onChange: (value: Partial<AutoInsuranceInputs>) => void;
}

const VEHICLE_MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti',
  'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati',
  'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Rivian',
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

const SAFETY_FEATURES = [
  'Anti-lock Brakes (ABS)',
  'Electronic Stability Control',
  'Airbags (Front)',
  'Airbags (Side)',
  'Backup Camera',
  'Blind Spot Monitoring',
  'Forward Collision Warning',
  'Automatic Emergency Braking',
  'Lane Departure Warning',
  'Lane Keep Assist',
  'Adaptive Cruise Control',
  'Parking Sensors',
  'Night Vision',
  'Tire Pressure Monitoring'
];

const ANTI_THEFT_DEVICES = [
  'Factory Alarm',
  'Aftermarket Alarm',
  'GPS Tracking',
  'Steering Wheel Lock',
  'Kill Switch',
  'VIN Etching',
  'Immobilizer'
];

const VIOLATION_TYPES = [
  { value: 'speeding', label: 'Speeding' },
  { value: 'dui', label: 'DUI/DWI' },
  { value: 'reckless', label: 'Reckless Driving' },
  { value: 'failure_to_stop', label: 'Failure to Stop' },
  { value: 'distracted', label: 'Distracted Driving' },
  { value: 'other', label: 'Other' }
];

const DRIVING_COURSES = [
  'Defensive Driving Course',
  'Accident Prevention Course',
  'Teen Driver Education',
  'Mature Driver Course (55+)',
  'Advanced Driving Course'
];

export function AutoInsuranceInputsForm({ value, onChange }: AutoInsuranceInputsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vehicles: true,
    drivers: true,
    coverage: false,
    discounts: false,
    current: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Initialize with defaults
  const vehicles = value.vehicles || [];
  const drivers = value.drivers || [];
  const coverage = value.coverage || {
    liabilityBodily: '100/300',
    liabilityProperty: 100000,
    uninsuredMotorist: true,
    underinsuredMotorist: true,
    medicalPayments: 5000,
    personalInjuryProtection: false,
    collisionDeductible: 500,
    comprehensiveDeductible: 500,
    rentalReimbursement: true,
    roadsideAssistance: true,
    gapCoverage: false,
    newCarReplacement: false,
    rideshareEndorsement: false,
    customEquipment: 0
  };
  const discounts = value.discounts || {
    multiPolicy: false,
    multiVehicle: false,
    goodDriver: false,
    goodStudent: false,
    distantStudent: false,
    defensiveDriving: false,
    antiTheft: false,
    lowMileage: false,
    payInFull: false,
    paperless: false,
    autopay: false,
    militaryVeteran: false,
    professionalMemberships: [],
    telematics: false,
    homeowner: false
  };

  const addVehicle = () => {
    const newVehicle: VehicleInfo = {
      year: new Date().getFullYear(),
      make: '',
      model: '',
      ownershipStatus: 'owned',
      primaryUse: 'commute',
      annualMileage: 12000,
      garageLocation: 'garage',
      antiTheftDevices: [],
      safetyFeatures: []
    };
    onChange({ ...value, vehicles: [...vehicles, newVehicle] });
  };

  const updateVehicle = (index: number, updates: Partial<VehicleInfo>) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], ...updates };
    onChange({ ...value, vehicles: newVehicles });
  };

  const removeVehicle = (index: number) => {
    onChange({ ...value, vehicles: vehicles.filter((_, i) => i !== index) });
  };

  const addDriver = () => {
    const newDriver: DriverInfo = {
      dateOfBirth: '',
      gender: 'male',
      maritalStatus: 'single',
      licenseState: '',
      licenseYears: 0,
      relationship: 'self',
      educationLevel: 'high_school',
      drivingRecord: {
        accidents: [],
        violations: [],
        claims: [],
        suspensions: false,
        sr22Required: false
      },
      completedCourses: []
    };
    onChange({ ...value, drivers: [...drivers, newDriver] });
  };

  const updateDriver = (index: number, updates: Partial<DriverInfo>) => {
    const newDrivers = [...drivers];
    newDrivers[index] = { ...newDrivers[index], ...updates };
    onChange({ ...value, drivers: newDrivers });
  };

  const removeDriver = (index: number) => {
    onChange({ ...value, drivers: drivers.filter((_, i) => i !== index) });
  };

  const addAccident = (driverIndex: number) => {
    const newAccident: AccidentRecord = {
      date: '',
      atFault: false,
      severity: 'minor',
      totalDamage: 0,
      injuries: false
    };
    const newDrivers = [...drivers];
    newDrivers[driverIndex].drivingRecord.accidents.push(newAccident);
    onChange({ ...value, drivers: newDrivers });
  };

  const addViolation = (driverIndex: number) => {
    const newViolation: ViolationRecord = {
      date: '',
      type: 'speeding',
      points: 0
    };
    const newDrivers = [...drivers];
    newDrivers[driverIndex].drivingRecord.violations.push(newViolation);
    onChange({ ...value, drivers: newDrivers });
  };

  return (
    <div className="space-y-6">
      {/* Vehicles Section */}
      <Collapsible open={expandedSections.vehicles} onOpenChange={() => toggleSection('vehicles')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Vehicles</CardTitle>
                    <CardDescription>Add all vehicles to be insured</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{vehicles.length} vehicle(s)</Badge>
                  {expandedSections.vehicles ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {vehicles.map((vehicle, index) => (
                <Card key={index} className="border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Vehicle {index + 1}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => removeVehicle(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select
                          value={vehicle.year?.toString()}
                          onValueChange={(v) => updateVehicle(index, { year: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Make</Label>
                        <Select
                          value={vehicle.make}
                          onValueChange={(v) => updateVehicle(index, { make: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select make" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_MAKES.map(make => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                          placeholder="e.g., Camry"
                          value={vehicle.model || ''}
                          onChange={(e) => updateVehicle(index, { model: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Trim (Optional)</Label>
                        <Input
                          placeholder="e.g., XLE"
                          value={vehicle.trim || ''}
                          onChange={(e) => updateVehicle(index, { trim: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* VIN */}
                    <div className="space-y-2">
                      <Label>VIN (Optional - for most accurate quote)</Label>
                      <Input
                        placeholder="17-character Vehicle Identification Number"
                        value={vehicle.vin || ''}
                        onChange={(e) => updateVehicle(index, { vin: e.target.value.toUpperCase() })}
                        maxLength={17}
                      />
                    </div>

                    {/* Ownership & Usage */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Ownership</Label>
                        <Select
                          value={vehicle.ownershipStatus}
                          onValueChange={(v: VehicleInfo['ownershipStatus']) => updateVehicle(index, { ownershipStatus: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owned">Owned (No Loan)</SelectItem>
                            <SelectItem value="financed">Financed</SelectItem>
                            <SelectItem value="leased">Leased</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Use</Label>
                        <Select
                          value={vehicle.primaryUse}
                          onValueChange={(v: VehicleInfo['primaryUse']) => updateVehicle(index, { primaryUse: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commute">Commute to Work/School</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="pleasure">Pleasure Only</SelectItem>
                            <SelectItem value="rideshare">Rideshare (Uber/Lyft)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Annual Mileage</Label>
                        <Select
                          value={vehicle.annualMileage?.toString()}
                          onValueChange={(v) => updateVehicle(index, { annualMileage: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5000">Under 5,000 mi</SelectItem>
                            <SelectItem value="7500">5,000 - 7,500 mi</SelectItem>
                            <SelectItem value="10000">7,500 - 10,000 mi</SelectItem>
                            <SelectItem value="12000">10,000 - 12,000 mi</SelectItem>
                            <SelectItem value="15000">12,000 - 15,000 mi</SelectItem>
                            <SelectItem value="20000">15,000 - 20,000 mi</SelectItem>
                            <SelectItem value="25000">20,000+ mi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Where Parked</Label>
                        <Select
                          value={vehicle.garageLocation}
                          onValueChange={(v: VehicleInfo['garageLocation']) => updateVehicle(index, { garageLocation: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="garage">Garage</SelectItem>
                            <SelectItem value="carport">Carport</SelectItem>
                            <SelectItem value="driveway">Driveway</SelectItem>
                            <SelectItem value="street">Street</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Safety Features */}
                    <div className="space-y-2">
                      <Label>Safety Features</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {SAFETY_FEATURES.map(feature => (
                          <div key={feature} className="flex items-center space-x-2">
                            <Checkbox
                              id={`safety-${index}-${feature}`}
                              checked={vehicle.safetyFeatures?.includes(feature)}
                              onCheckedChange={(checked) => {
                                const features = vehicle.safetyFeatures || [];
                                if (checked) {
                                  updateVehicle(index, { safetyFeatures: [...features, feature] });
                                } else {
                                  updateVehicle(index, { safetyFeatures: features.filter(f => f !== feature) });
                                }
                              }}
                            />
                            <Label htmlFor={`safety-${index}-${feature}`} className="text-sm font-normal">
                              {feature}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Anti-theft */}
                    <div className="space-y-2">
                      <Label>Anti-Theft Devices</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {ANTI_THEFT_DEVICES.map(device => (
                          <div key={device} className="flex items-center space-x-2">
                            <Checkbox
                              id={`theft-${index}-${device}`}
                              checked={vehicle.antiTheftDevices?.includes(device)}
                              onCheckedChange={(checked) => {
                                const devices = vehicle.antiTheftDevices || [];
                                if (checked) {
                                  updateVehicle(index, { antiTheftDevices: [...devices, device] });
                                } else {
                                  updateVehicle(index, { antiTheftDevices: devices.filter(d => d !== device) });
                                }
                              }}
                            />
                            <Label htmlFor={`theft-${index}-${device}`} className="text-sm font-normal">
                              {device}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full" onClick={addVehicle}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Drivers Section */}
      <Collapsible open={expandedSections.drivers} onOpenChange={() => toggleSection('drivers')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Drivers</CardTitle>
                    <CardDescription>Add all drivers in your household</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{drivers.length} driver(s)</Badge>
                  {expandedSections.drivers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {drivers.map((driver, driverIndex) => (
                <Card key={driverIndex} className="border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Driver {driverIndex + 1}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => removeDriver(driverIndex)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={driver.dateOfBirth || ''}
                          onChange={(e) => updateDriver(driverIndex, { dateOfBirth: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={driver.gender}
                          onValueChange={(v: DriverInfo['gender']) => updateDriver(driverIndex, { gender: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Marital Status</Label>
                        <Select
                          value={driver.maritalStatus}
                          onValueChange={(v: DriverInfo['maritalStatus']) => updateDriver(driverIndex, { maritalStatus: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="domestic_partner">Domestic Partner</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship</Label>
                        <Select
                          value={driver.relationship}
                          onValueChange={(v: DriverInfo['relationship']) => updateDriver(driverIndex, { relationship: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">Self (Primary)</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* License Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>License State</Label>
                        <Input
                          placeholder="e.g., CA"
                          maxLength={2}
                          value={driver.licenseState || ''}
                          onChange={(e) => updateDriver(driverIndex, { licenseState: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Years Licensed</Label>
                        <Select
                          value={driver.licenseYears?.toString()}
                          onValueChange={(v) => updateDriver(driverIndex, { licenseYears: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => i).map(years => (
                              <SelectItem key={years} value={years.toString()}>
                                {years === 0 ? 'Less than 1 year' : `${years} year${years !== 1 ? 's' : ''}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Education</Label>
                        <Select
                          value={driver.educationLevel}
                          onValueChange={(v: DriverInfo['educationLevel']) => updateDriver(driverIndex, { educationLevel: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high_school">High School</SelectItem>
                            <SelectItem value="associates">Associates Degree</SelectItem>
                            <SelectItem value="bachelors">Bachelors Degree</SelectItem>
                            <SelectItem value="masters">Masters Degree</SelectItem>
                            <SelectItem value="doctorate">Doctorate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Occupation</Label>
                        <Input
                          placeholder="Job title"
                          value={driver.occupation || ''}
                          onChange={(e) => updateDriver(driverIndex, { occupation: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Driving Record */}
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Driving Record (Last 5 Years)</span>
                      </div>

                      {/* Accidents */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Accidents</Label>
                          <Button variant="outline" size="sm" onClick={() => addAccident(driverIndex)}>
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>
                        {driver.drivingRecord.accidents.map((accident, accIndex) => (
                          <div key={accIndex} className="grid grid-cols-5 gap-2 items-end">
                            <Input
                              type="date"
                              placeholder="Date"
                              value={accident.date}
                              onChange={(e) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.accidents[accIndex].date = e.target.value;
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            />
                            <Select
                              value={accident.atFault ? 'yes' : 'no'}
                              onValueChange={(v) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.accidents[accIndex].atFault = v === 'yes';
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="At Fault?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">At Fault</SelectItem>
                                <SelectItem value="no">Not At Fault</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={accident.severity}
                              onValueChange={(v: AccidentRecord['severity']) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.accidents[accIndex].severity = v;
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Severity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minor">Minor</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="major">Major</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="$ Damage"
                              value={accident.totalDamage || ''}
                              onChange={(e) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.accidents[accIndex].totalDamage = parseInt(e.target.value) || 0;
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.accidents.splice(accIndex, 1);
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        {driver.drivingRecord.accidents.length === 0 && (
                          <p className="text-sm text-muted-foreground">No accidents reported</p>
                        )}
                      </div>

                      {/* Violations */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Traffic Violations</Label>
                          <Button variant="outline" size="sm" onClick={() => addViolation(driverIndex)}>
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>
                        {driver.drivingRecord.violations.map((violation, violIndex) => (
                          <div key={violIndex} className="grid grid-cols-4 gap-2 items-end">
                            <Input
                              type="date"
                              placeholder="Date"
                              value={violation.date}
                              onChange={(e) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.violations[violIndex].date = e.target.value;
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            />
                            <Select
                              value={violation.type}
                              onValueChange={(v: ViolationRecord['type']) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.violations[violIndex].type = v;
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {VIOLATION_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Points"
                              value={violation.points || ''}
                              onChange={(e) => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.violations[violIndex].points = parseInt(e.target.value) || 0;
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDrivers = [...drivers];
                                newDrivers[driverIndex].drivingRecord.violations.splice(violIndex, 1);
                                onChange({ ...value, drivers: newDrivers });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        {driver.drivingRecord.violations.length === 0 && (
                          <p className="text-sm text-muted-foreground">No violations reported</p>
                        )}
                      </div>

                      {/* SR-22 */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`sr22-${driverIndex}`}
                          checked={driver.drivingRecord.sr22Required}
                          onCheckedChange={(checked) => {
                            const newDrivers = [...drivers];
                            newDrivers[driverIndex].drivingRecord.sr22Required = checked as boolean;
                            onChange({ ...value, drivers: newDrivers });
                          }}
                        />
                        <Label htmlFor={`sr22-${driverIndex}`} className="text-sm">
                          SR-22 Filing Required
                        </Label>
                      </div>
                    </div>

                    {/* Completed Courses */}
                    <div className="space-y-2">
                      <Label>Completed Driving Courses</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {DRIVING_COURSES.map(course => (
                          <div key={course} className="flex items-center space-x-2">
                            <Checkbox
                              id={`course-${driverIndex}-${course}`}
                              checked={driver.completedCourses?.includes(course)}
                              onCheckedChange={(checked) => {
                                const courses = driver.completedCourses || [];
                                if (checked) {
                                  updateDriver(driverIndex, { completedCourses: [...courses, course] });
                                } else {
                                  updateDriver(driverIndex, { completedCourses: courses.filter(c => c !== course) });
                                }
                              }}
                            />
                            <Label htmlFor={`course-${driverIndex}-${course}`} className="text-sm font-normal">
                              {course}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full" onClick={addDriver}>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Coverage Section */}
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
                    <CardDescription>Select your desired coverage levels</CardDescription>
                  </div>
                </div>
                {expandedSections.coverage ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Liability Coverage */}
              <div className="space-y-4">
                <h4 className="font-medium">Liability Coverage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bodily Injury Liability (per person/per accident)</Label>
                    <Select
                      value={coverage.liabilityBodily}
                      onValueChange={(v: typeof coverage.liabilityBodily) => 
                        onChange({ ...value, coverage: { ...coverage, liabilityBodily: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25/50">$25,000 / $50,000 (State Minimum)</SelectItem>
                        <SelectItem value="50/100">$50,000 / $100,000</SelectItem>
                        <SelectItem value="100/300">$100,000 / $300,000 (Recommended)</SelectItem>
                        <SelectItem value="250/500">$250,000 / $500,000</SelectItem>
                        <SelectItem value="500/500">$500,000 / $500,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Property Damage Liability</Label>
                    <Select
                      value={coverage.liabilityProperty?.toString()}
                      onValueChange={(v) => 
                        onChange({ ...value, coverage: { ...coverage, liabilityProperty: parseInt(v) } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25000">$25,000 (State Minimum)</SelectItem>
                        <SelectItem value="50000">$50,000</SelectItem>
                        <SelectItem value="100000">$100,000 (Recommended)</SelectItem>
                        <SelectItem value="250000">$250,000</SelectItem>
                        <SelectItem value="500000">$500,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Uninsured/Underinsured */}
              <div className="space-y-4">
                <h4 className="font-medium">Uninsured/Underinsured Motorist</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uninsured"
                      checked={coverage.uninsuredMotorist}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, uninsuredMotorist: checked as boolean } })
                      }
                    />
                    <Label htmlFor="uninsured">Uninsured Motorist Coverage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="underinsured"
                      checked={coverage.underinsuredMotorist}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, underinsuredMotorist: checked as boolean } })
                      }
                    />
                    <Label htmlFor="underinsured">Underinsured Motorist Coverage</Label>
                  </div>
                </div>
              </div>

              {/* Deductibles */}
              <div className="space-y-4">
                <h4 className="font-medium">Deductibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collision Deductible</Label>
                    <Select
                      value={coverage.collisionDeductible?.toString()}
                      onValueChange={(v) => 
                        onChange({ ...value, coverage: { ...coverage, collisionDeductible: parseInt(v) as typeof coverage.collisionDeductible } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">$0 (No Deductible)</SelectItem>
                        <SelectItem value="250">$250</SelectItem>
                        <SelectItem value="500">$500 (Recommended)</SelectItem>
                        <SelectItem value="1000">$1,000</SelectItem>
                        <SelectItem value="2000">$2,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Comprehensive Deductible</Label>
                    <Select
                      value={coverage.comprehensiveDeductible?.toString()}
                      onValueChange={(v) => 
                        onChange({ ...value, coverage: { ...coverage, comprehensiveDeductible: parseInt(v) as typeof coverage.comprehensiveDeductible } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">$0 (No Deductible)</SelectItem>
                        <SelectItem value="250">$250</SelectItem>
                        <SelectItem value="500">$500 (Recommended)</SelectItem>
                        <SelectItem value="1000">$1,000</SelectItem>
                        <SelectItem value="2000">$2,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Medical */}
              <div className="space-y-4">
                <h4 className="font-medium">Medical Coverage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medical Payments (MedPay)</Label>
                    <Select
                      value={coverage.medicalPayments?.toString()}
                      onValueChange={(v) => 
                        onChange({ ...value, coverage: { ...coverage, medicalPayments: parseInt(v) } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1000">$1,000</SelectItem>
                        <SelectItem value="2500">$2,500</SelectItem>
                        <SelectItem value="5000">$5,000 (Recommended)</SelectItem>
                        <SelectItem value="10000">$10,000</SelectItem>
                        <SelectItem value="25000">$25,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <Checkbox
                      id="pip"
                      checked={coverage.personalInjuryProtection}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, personalInjuryProtection: checked as boolean } })
                      }
                    />
                    <Label htmlFor="pip">Personal Injury Protection (PIP)</Label>
                  </div>
                </div>
              </div>

              {/* Additional Coverages */}
              <div className="space-y-4">
                <h4 className="font-medium">Additional Coverages</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rental"
                      checked={coverage.rentalReimbursement}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, rentalReimbursement: checked as boolean } })
                      }
                    />
                    <Label htmlFor="rental">Rental Reimbursement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roadside"
                      checked={coverage.roadsideAssistance}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, roadsideAssistance: checked as boolean } })
                      }
                    />
                    <Label htmlFor="roadside">Roadside Assistance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gap"
                      checked={coverage.gapCoverage}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, gapCoverage: checked as boolean } })
                      }
                    />
                    <Label htmlFor="gap">Gap Coverage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newcar"
                      checked={coverage.newCarReplacement}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, newCarReplacement: checked as boolean } })
                      }
                    />
                    <Label htmlFor="newcar">New Car Replacement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rideshare"
                      checked={coverage.rideshareEndorsement}
                      onCheckedChange={(checked) => 
                        onChange({ ...value, coverage: { ...coverage, rideshareEndorsement: checked as boolean } })
                      }
                    />
                    <Label htmlFor="rideshare">Rideshare Endorsement</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Discounts Section */}
      <Collapsible open={expandedSections.discounts} onOpenChange={() => toggleSection('discounts')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Available Discounts</CardTitle>
                    <CardDescription>Select all that apply to maximize savings</CardDescription>
                  </div>
                </div>
                {expandedSections.discounts ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'multiPolicy', label: 'Multi-Policy (Bundle with Home)' },
                  { key: 'multiVehicle', label: 'Multi-Vehicle' },
                  { key: 'goodDriver', label: 'Good Driver (No violations)' },
                  { key: 'goodStudent', label: 'Good Student (B average or better)' },
                  { key: 'distantStudent', label: 'Distant Student (100+ miles from home)' },
                  { key: 'defensiveDriving', label: 'Defensive Driving Course' },
                  { key: 'antiTheft', label: 'Anti-Theft Device' },
                  { key: 'lowMileage', label: 'Low Mileage (<7,500/year)' },
                  { key: 'payInFull', label: 'Pay in Full' },
                  { key: 'paperless', label: 'Paperless/E-billing' },
                  { key: 'autopay', label: 'Automatic Payments' },
                  { key: 'militaryVeteran', label: 'Military/Veteran' },
                  { key: 'telematics', label: 'Telematics/Usage-Based' },
                  { key: 'homeowner', label: 'Homeowner' },
                ].map(discount => (
                  <div key={discount.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={discount.key}
                      checked={discounts[discount.key as keyof typeof discounts] as boolean}
                      onCheckedChange={(checked) => 
                        onChange({ 
                          ...value, 
                          discounts: { ...discounts, [discount.key]: checked as boolean } 
                        })
                      }
                    />
                    <Label htmlFor={discount.key} className="text-sm font-normal">{discount.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Current Policy Section */}
      <Collapsible open={expandedSections.current} onOpenChange={() => toggleSection('current')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Car className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Current Policy (Optional)</CardTitle>
                    <CardDescription>Help us show you potential savings</CardDescription>
                  </div>
                </div>
                {expandedSections.current ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Insurance Carrier</Label>
                  <Input
                    placeholder="e.g., State Farm, Geico"
                    value={value.currentPolicy?.carrier || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentPolicy: { ...value.currentPolicy, carrier: e.target.value } as typeof value.currentPolicy 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Monthly Premium</Label>
                  <Input
                    type="number"
                    placeholder="$ per month"
                    value={value.currentPolicy?.premium || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentPolicy: { ...value.currentPolicy, premium: parseInt(e.target.value) || 0 } as typeof value.currentPolicy 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Expiration Date</Label>
                  <Input
                    type="date"
                    value={value.currentPolicy?.expirationDate || ''}
                    onChange={(e) => 
                      onChange({ 
                        ...value, 
                        currentPolicy: { ...value.currentPolicy, expirationDate: e.target.value } as typeof value.currentPolicy 
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years with Current Carrier</Label>
                  <Select
                    value={value.currentPolicy?.yearsWithCarrier?.toString() || ''}
                    onValueChange={(v) => 
                      onChange({ 
                        ...value, 
                        currentPolicy: { ...value.currentPolicy, yearsWithCarrier: parseInt(v) } as typeof value.currentPolicy 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i).map(years => (
                        <SelectItem key={years} value={years.toString()}>
                          {years === 0 ? 'Less than 1 year' : `${years} year${years !== 1 ? 's' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export default AutoInsuranceInputsForm;



