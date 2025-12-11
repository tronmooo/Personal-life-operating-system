'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Home, Plus, Trash2, DollarSign, MapPin, Edit2, Save, X, Sparkles, RefreshCw } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { getAIHomeValueWithAPI } from '@/lib/services/ai-home-value'

interface Property {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  estimatedValue: number
  lastUpdated: string
  type: 'primary' | 'rental' | 'investment' | 'vacation'
}

export function PropertyManager() {
  const { getData, addData } = useData()
  const [properties, setProperties] = useState<Property[]>([])
  
  // Load from DataProvider instead of localStorage
  useEffect(() => {
    const homeData = getData('home')
    const loadedProperties = homeData
      .filter(item => item.metadata?.type === 'property')
      .map(item => ({
        id: item.id,
        address: item.metadata?.address || '',
        city: item.metadata?.city || '',
        state: item.metadata?.state || '',
        zipCode: item.metadata?.zipCode || '',
        estimatedValue: parseFloat(String(item.metadata?.value || item.metadata?.estimatedValue || '0')),
        lastUpdated: item.updatedAt || item.createdAt,
        type: item.metadata?.propertyType || 'primary'
      } as Property))
    
    setProperties(loadedProperties)
  }, [getData])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFetchingValue, setIsFetchingValue] = useState(false)
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    estimatedValue: '',
    type: 'primary' as Property['type']
  })

  const handleAutoFetchValue = async () => {
    if (!formData.address) {
      alert('Please enter an address first')
      return
    }
    
    setIsFetchingValue(true)
    try {
      const fullAddress = `${formData.address}, ${formData.city || ''} ${formData.state || ''}`.trim()
      
      // First try RapidAPI Zillow
      console.log('🏠 Fetching from RapidAPI Zillow:', fullAddress)
      const rapidApiResponse = await fetch('/api/zillow-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: fullAddress })
      })
      
      let rapidApiResult;
      try {
        rapidApiResult = await rapidApiResponse.json()
      } catch (e) {
        console.error('Failed to parse response:', e)
        throw new Error('Invalid response from server')
      }

      if (!rapidApiResponse.ok) {
         if (rapidApiResponse.status === 401) {
            throw new Error('Authentication required. Please refresh the page or sign in again.')
         }
         throw new Error(rapidApiResult.error || 'Failed to fetch property value')
      }
      
      // If RapidAPI fails, fallback to AI estimate
      let result = rapidApiResult
      if (!rapidApiResult.success) {
        console.log('🤖 Falling back to AI estimate')
        result = await getAIHomeValueWithAPI(fullAddress)
        result.source = 'AI Estimate (RapidAPI unavailable)'
      }
      
      setFormData({
        ...formData,
        estimatedValue: result.estimatedValue.toString()
      })
      
      const alertMessage = `${result.source?.includes('RapidAPI') ? '🏠 RapidAPI Zillow Value' : '🤖 AI Home Value'}: $${result.estimatedValue.toLocaleString()}\n\n✅ Confidence: ${result.confidence.toUpperCase()}\n\n📊 ${result.marketTrends}\n\n🏘️ Source: ${result.source}\n\n${result.comparables?.join('\n') || ''}`
      alert(alertMessage)
    } catch (error) {
      console.error('Error fetching property value:', error)
      alert('Failed to fetch property value. Please enter manually.')
    } finally {
      setIsFetchingValue(false)
    }
  }

  const saveProperties = (newProperties: Property[]) => {
    setProperties(newProperties)
    
    // ONLY save to DataProvider - remove duplicate localStorage storage
    newProperties.forEach(prop => {
      // Check if this property already exists in DataProvider
      const existingProperties = getData('home').filter(item => 
        item.metadata?.type === 'property' && 
        item.metadata?.address === prop.address
      )
      
      if (existingProperties.length === 0) {
        // New property - add it
        addData('home', {
          title: `Property: ${prop.address}`,
          description: `${prop.type} property valued at $${prop.estimatedValue.toLocaleString()}`,
          metadata: {
            type: 'property',
            itemType: 'property',
            address: prop.address,
            city: prop.city,
            state: prop.state,
            zipCode: prop.zipCode,
            value: prop.estimatedValue,
            estimatedValue: prop.estimatedValue,
            propertyType: prop.type,
            logType: 'property-value'
          }
        })
      }
    })
    
    // Trigger storage event for Command Center to update
    window.dispatchEvent(new Event('storage'))
  }

  const handleAdd = () => {
    if (!formData.address || !formData.estimatedValue) {
      alert('Please enter at least an address and estimated value')
      return
    }

    const newProperty: Property = {
      id: Date.now().toString(),
      address: formData.address,
      city: formData.city || 'Unknown',
      state: formData.state || 'N/A',
      zipCode: formData.zipCode || '',
      estimatedValue: parseFloat(formData.estimatedValue),
      lastUpdated: new Date().toISOString(),
      type: formData.type
    }

    const updatedProperties = [...properties, newProperty]
    saveProperties(updatedProperties)
    setFormData({ address: '', city: '', state: '', zipCode: '', estimatedValue: '', type: 'primary' })
    setIsAdding(false)
    
    // Show success message
    alert(`Property added! Total value: $${updatedProperties.reduce((sum, p) => sum + p.estimatedValue, 0).toLocaleString()}`)
  }

  const handleUpdate = (id: string) => {
    const updated = properties.map(p => 
      p.id === id
        ? {
            ...p,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            estimatedValue: parseFloat(formData.estimatedValue),
            type: formData.type,
            lastUpdated: new Date().toISOString()
          }
        : p
    )
    saveProperties(updated)
    setEditingId(null)
    setFormData({ address: '', city: '', state: '', zipCode: '', estimatedValue: '', type: 'primary' })
  }

  const handleDelete = (id: string) => {
    saveProperties(properties.filter(p => p.id !== id))
  }

  const startEdit = (property: Property) => {
    setEditingId(property.id)
    setFormData({
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      estimatedValue: property.estimatedValue.toString(),
      type: property.type
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ address: '', city: '', state: '', zipCode: '', estimatedValue: '', type: 'primary' })
  }

  const totalValue = properties.reduce((sum, p) => sum + p.estimatedValue, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-500" />
              Property Portfolio
            </CardTitle>
            <CardDescription>
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} • Total Value: ${totalValue.toLocaleString()}
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-blue-500/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="New York"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    placeholder="NY"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="500000"
                      value={formData.estimatedValue}
                      onChange={e => setFormData({ ...formData, estimatedValue: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoFetchValue}
                      disabled={isFetchingValue || !formData.address}
                    >
                      {isFetchingValue ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Get Value (RapidAPI)
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    🔍 Uses RapidAPI to fetch Zillow property values (with AI fallback)
                  </p>
                </div>
                <div>
                  <Label>Property Type</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as Property['type'] })}
                  >
                    <option value="primary">Primary Residence</option>
                    <option value="rental">Rental Property</option>
                    <option value="investment">Investment</option>
                    <option value="vacation">Vacation Home</option>
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
                  {editingId ? 'Update' : 'Add'} Property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Property List */}
        {properties.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No properties added yet</p>
            <p className="text-sm mt-2">Add your first property to track its value</p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map(property => (
              <Card key={property.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{property.address}</span>
                        <Badge variant="outline">{property.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state} {property.zipCode}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-bold text-green-500">
                          ${property.estimatedValue.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date(property.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(property)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
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
        {properties.length > 0 && (
          <Card className="bg-blue-500/10 border-blue-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-blue-500">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <Home className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

