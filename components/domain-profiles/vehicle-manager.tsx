'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Car, Plus, Trash2, DollarSign, Edit2, Save, X, Gauge, Sparkles } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { getCarValueAI } from '@/lib/services/car-value-service'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin?: string
  mileage?: number
  estimatedValue: number
  lastUpdated: string
  type: 'sedan' | 'suv' | 'truck' | 'van' | 'motorcycle' | 'other'
}

export function VehicleManager() {
  const { getData, addData, updateData, deleteData } = useData()
  
  // Get vehicles from DataProvider (auto-syncs with Supabase)
  const vehicleData = getData('vehicles')
  const vehicles = vehicleData
    .filter(item => item.metadata?.type === 'vehicle')
    .map(item => ({
      id: item.id,
      make: item.metadata?.make || '',
      model: item.metadata?.model || '',
      year: item.metadata?.year || 0,
      vin: item.metadata?.vin,
      mileage: item.metadata?.mileage,
      estimatedValue: item.metadata?.value || 0,
      lastUpdated: item.updatedAt || item.createdAt,
      type: item.metadata?.vehicleType || 'sedan'
    } as Vehicle))
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFetchingValue, setIsFetchingValue] = useState(false)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    mileage: '',
    estimatedValue: '',
    type: 'sedan' as Vehicle['type']
  })

  const handleAutoFetchValue = async () => {
    if (!formData.make || !formData.model || !formData.year) {
      alert('Please enter make, model, and year first')
      return
    }
    
    setIsFetchingValue(true)
    try {
      const result = await getCarValueAI({
        make: formData.make,
        model: formData.model,
        year: formData.year,
        mileage: formData.mileage || '0'
      })
      setFormData({
        ...formData,
        estimatedValue: result.estimatedValue.toString()
      })
      alert(`Estimated value: $${result.estimatedValue.toLocaleString()}\n\nBreakdown:\n• Trade-in: $${result.tradeInValue.toLocaleString()}\n• Private party: $${result.privatePartyValue.toLocaleString()}\n• Retail: $${result.retailValue.toLocaleString()}`)
    } catch (error) {
      alert('Failed to fetch vehicle value. Please enter manually.')
    } finally {
      setIsFetchingValue(false)
    }
  }

  const handleAdd = () => {
    // Validation
    if (!formData.make?.trim() || !formData.model?.trim()) {
      alert('Please enter make and model')
      return
    }
    if (!formData.year || isNaN(parseInt(formData.year)) || parseInt(formData.year) < 1900) {
      alert('Please enter a valid year')
      return
    }
    if (!formData.estimatedValue || isNaN(parseFloat(formData.estimatedValue)) || parseFloat(formData.estimatedValue) <= 0) {
      alert('Please enter a valid estimated value')
      return
    }

    console.log('🚗 Adding vehicle:', formData)

    // Add to DataProvider (auto-syncs to Supabase)
    addData('vehicles', {
      title: `${formData.year} ${formData.make} ${formData.model}`,
      description: `${formData.type.toUpperCase()} - $${parseFloat(formData.estimatedValue).toLocaleString()}`,
      metadata: {
        type: 'vehicle',
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        vin: formData.vin || undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        value: parseFloat(formData.estimatedValue),
        estimatedValue: parseFloat(formData.estimatedValue),
        vehicleType: formData.type,
        logType: 'vehicle-value'
      }
    })

    console.log('✅ Vehicle added successfully')
    setFormData({ make: '', model: '', year: '', vin: '', mileage: '', estimatedValue: '', type: 'sedan' })
    setIsAdding(false)
  }

  const handleUpdate = (id: string) => {
    // Update in DataProvider (auto-syncs to Supabase)
    updateData('vehicles', id, {
      title: `${formData.year} ${formData.make} ${formData.model}`,
      description: `${formData.type.toUpperCase()} - $${parseFloat(formData.estimatedValue).toLocaleString()}`,
      metadata: {
        type: 'vehicle',
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        vin: formData.vin || undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        value: parseFloat(formData.estimatedValue),
        vehicleType: formData.type,
        logType: 'vehicle-value'
      }
    })
    setEditingId(null)
    setFormData({ make: '', model: '', year: '', vin: '', mileage: '', estimatedValue: '', type: 'sedan' })
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this vehicle?')) {
      deleteData('vehicles', id)
    }
  }

  const startEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id)
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      vin: vehicle.vin || '',
      mileage: vehicle.mileage?.toString() || '',
      estimatedValue: vehicle.estimatedValue.toString(),
      type: vehicle.type
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ make: '', model: '', year: '', vin: '', mileage: '', estimatedValue: '', type: 'sedan' })
  }

  const totalValue = vehicles.reduce((sum, v) => sum + v.estimatedValue, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-indigo-500" />
              Vehicle Fleet
            </CardTitle>
            <CardDescription>
              {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} • Total Value: ${totalValue.toLocaleString()}
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-indigo-500/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Make</Label>
                  <Input
                    placeholder="Toyota"
                    value={formData.make}
                    onChange={e => setFormData({ ...formData, make: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    placeholder="Camry"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    placeholder="2020"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
                <div>
                  <Label>VIN (Optional)</Label>
                  <Input
                    placeholder="1HGBH41JXMN109186"
                    value={formData.vin}
                    onChange={e => setFormData({ ...formData, vin: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Mileage (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={formData.mileage}
                    onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="25000"
                      value={formData.estimatedValue}
                      onChange={e => setFormData({ ...formData, estimatedValue: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoFetchValue}
                      disabled={isFetchingValue || !formData.make || !formData.model || !formData.year}
                    >
                      {isFetchingValue ? (
                        <>Fetching...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Auto
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter make, model, and year first, then click Auto to fetch KBB-style value
                  </p>
                </div>
                <div>
                  <Label>Vehicle Type</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as Vehicle['type'] })}
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Add'} Vehicle
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle List */}
        {vehicles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vehicles added yet</p>
            <p className="text-sm mt-2">Add your first vehicle to track its value</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map(vehicle => (
              <Card key={vehicle.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                        <Badge variant="outline">{vehicle.type}</Badge>
                      </div>
                      {vehicle.vin && (
                        <p className="text-sm text-muted-foreground">
                          VIN: {vehicle.vin}
                        </p>
                      )}
                      {vehicle.mileage && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Gauge className="h-3 w-3" />
                          {vehicle.mileage.toLocaleString()} miles
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-bold text-green-500">
                          ${vehicle.estimatedValue.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date(vehicle.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(vehicle)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {vehicles.length > 0 && (
          <Card className="bg-indigo-500/10 border-indigo-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fleet Value</p>
                  <p className="text-3xl font-bold text-indigo-500">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <Car className="h-12 w-12 text-indigo-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

