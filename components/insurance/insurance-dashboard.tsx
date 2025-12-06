'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Shield, FileText, DollarSign, Plus, Trash2, Edit, AlertTriangle, Calendar, User, FileIcon } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format, differenceInDays } from 'date-fns'
import { useRouter } from 'next/navigation'

interface Props {
  onAddPolicy: () => void
  onAddClaim: () => void
  onEditPolicy?: (policyId: string) => void
}

interface Policy {
  id: string
  type: string
  provider: string
  policyNumber: string
  premium: number
  frequency: string
  coverage: number
  validUntil: string
  expiryDate?: string
  status: string
  phone?: string
  email?: string
  documentPhoto?: string
}

interface Claim {
  id: string
  claimNumber: string
  status: string
}

export function InsuranceDashboard({ onAddPolicy, onAddClaim, onEditPolicy }: Props) {
  const { getData, deleteData } = useData()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [activeTab, setActiveTab] = useState<'policies' | 'claims' | 'payments'>('policies')
  useEffect(() => {
    loadData()
  }, [getData])

  const loadData = () => {
    // Load from DataProvider (database-backed)
    const rawInsuranceData = getData('insurance') as any
    // Handle both flat array and { items: [...] } structure
    let insuranceData: any[] = []
    if (Array.isArray(rawInsuranceData)) {
      insuranceData = rawInsuranceData
    } else if (rawInsuranceData && Array.isArray(rawInsuranceData.items)) {
      insuranceData = rawInsuranceData.items
    }
    
    const loadedPolicies: Policy[] = []
    const loadedClaims: Claim[] = []
    
    insuranceData.forEach(item => {
      // Handle both old structure (metadata.itemType) and new scanned document structure (type)
      const isPolicy = item.metadata?.itemType === 'policy' || item.type === 'insurance_policy'
      
      if (isPolicy) {
        const policy = {
          id: item.id,
          type: item.metadata?.type || item.coverageType || 'health',
          provider: item.metadata?.provider || item.provider || '',
          policyNumber: item.metadata?.policyNumber || item.policyNumber || '',
          premium: Number(item.metadata?.premium || item.metadata?.monthlyPremium || 0),
          frequency: item.metadata?.frequency || 'Monthly',
          coverage: Number(item.metadata?.coverage || 0),
          validUntil: item.metadata?.validUntil || item.expirationDate || item.effectiveDate || '',
          expiryDate: item.metadata?.expiryDate || item.metadata?.validUntil || item.expirationDate || '',
          status: item.metadata?.status || 'Active',
          phone: item.metadata?.phone,
          email: item.metadata?.email,
          documentPhoto: item.metadata?.documentPhoto || item.documentUrl
        }
        
        console.log('📄 Policy loaded:', {
          id: policy.id,
          provider: policy.provider,
          expiryDate: policy.expiryDate,
          hasDocumentPhoto: !!policy.documentPhoto,
          documentUrl: item.documentUrl,
          itemKeys: Object.keys(item)
        })
        
        loadedPolicies.push(policy)
      } else if (item.metadata?.itemType === 'claim') {
        loadedClaims.push({
          id: item.id,
          claimNumber: item.metadata?.claimNumber || '',
          status: item.metadata?.status || 'Pending'
        })
      }
    })
    
    setPolicies(loadedPolicies)
    setClaims(loadedClaims)
    
    console.log('📊 Loaded insurance:', { policies: loadedPolicies.length, claims: loadedClaims.length })
  }

  useEffect(() => {
    // Listen for data updates
    const handleDataUpdate = () => loadData()
    window.addEventListener('data-updated', handleDataUpdate)
    window.addEventListener('insurance-data-updated', handleDataUpdate)
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate)
      window.removeEventListener('insurance-data-updated', handleDataUpdate)
    }
  }, [getData])

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return
    
    try {
      await deleteData('insurance', policyId)
      loadData()
    } catch (error) {
      console.error('Failed to delete policy:', error)
      alert('Failed to delete policy')
    }
  }

  const handleEditPolicy = (policyId: string) => {
    if (onEditPolicy) {
      onEditPolicy(policyId)
    }
  }

  const handleViewDocuments = async (policyId: string) => {
    // Navigate to Domains > Insurance > Documents tab
    window.location.href = `/domains/insurance?tab=documents&policyId=${policyId}`
  }

  const totalPolicies = policies.length
  const activePolicies = policies.filter(p => p.status === 'Active').length
  const totalAnnual = policies
    .filter(p => p.status === 'Active')
    .reduce((sum, p) => {
      const mult = p.frequency === 'Monthly' ? 12 : p.frequency === 'Quarterly' ? 4 : 1
      return sum + (p.premium * mult)
    }, 0)

  // Helper function to parse date string as local date (not UTC)
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date()
    
    // If it's already in ISO format with time, use it as-is
    if (dateStr.includes('T')) {
      return new Date(dateStr)
    }
    
    // For date-only strings like "2025-10-22", parse as local date
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Helper function to format date correctly
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'Not set'
    
    const date = parseLocalDate(dateStr)
    return format(date, 'MM/dd/yyyy')
  }

  // Helper functions for display (matching legal documents style)
  const getExpirationStatus = (expiryDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day
    
    const expiry = parseLocalDate(expiryDate)
    expiry.setHours(0, 0, 0, 0) // Normalize to start of day
    
    const daysUntilExpiry = differenceInDays(expiry, today)
    
    if (daysUntilExpiry < 0) {
      return {
        days: daysUntilExpiry,
        text: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
        color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      }
    } else if (daysUntilExpiry <= 7) {
      return {
        days: daysUntilExpiry,
        text: `${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'} left`,
        color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      }
    } else if (daysUntilExpiry <= 30) {
      return {
        days: daysUntilExpiry,
        text: `${daysUntilExpiry} days left`,
        color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      }
    } else if (daysUntilExpiry <= 63) {
      return {
        days: daysUntilExpiry,
        text: `${daysUntilExpiry} days left`,
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      }
    } else {
      return {
        days: daysUntilExpiry,
        text: `Valid for ${daysUntilExpiry} days`,
        color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      }
    }
  }

  const getPolicyIcon = (type: string) => {
    const icons: Record<string, string> = {
      'health': '🏥',
      'auto': '🚗',
      'home': '🏠',
      'life': '❤️',
      'dental': '🦷',
      'vision': '👁️',
      'pet': '🐾',
    }
    return icons[type.toLowerCase()] || '📋'
  }

  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <p className="text-gray-600 mb-1">Total Policies</p>
          <p className="text-5xl font-bold">{totalPolicies}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <p className="text-gray-600 mb-1">Active Policies</p>
          <p className="text-5xl font-bold">{activePolicies}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <p className="text-gray-600 mb-1">Annual Premium</p>
          <p className="text-4xl font-bold">${totalAnnual.toLocaleString()}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500">
          <p className="text-gray-600 mb-1">Total Claims</p>
          <p className="text-5xl font-bold">{claims.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'policies'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Insurance Policies
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'claims'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Claims Management
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'payments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Premium Tracker
        </button>
      </div>

      {/* Content */}
      {activeTab === 'policies' && (
        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Insurance Policies</h2>
            <button
              onClick={onAddPolicy}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Policy
            </button>
          </div>

          {policies.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No items yet</p>
              <p className="text-sm text-gray-500 mb-6">Get started by adding your first insurance item</p>
              <button
                onClick={onAddPolicy}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map(policy => {
                const status = getExpirationStatus(policy.expiryDate || policy.validUntil)
                
                return (
                  <Card key={policy.id} className="p-6 hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Header with Icon */}
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-4xl">{getPolicyIcon(policy.type)}</span>
                          <div>
                            <h3 className="text-2xl font-bold">{policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance - {policy.provider}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Policy #{policy.policyNumber}</p>
                          </div>
                        </div>

                        {/* Expiration Status Box */}
                        {status.days <= 63 && (
                          <div className={`${status.color} rounded-xl p-4 mb-4 flex items-center gap-3`}>
                            <AlertTriangle className="w-5 h-5" />
                            <div>
                              <p className="font-semibold">Expiration Status</p>
                              <p className="text-sm">{status.text}</p>
                            </div>
                          </div>
                        )}

                        {/* Expiration Date */}
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold">Expires: {formatDate(policy.expiryDate || policy.validUntil)}</span>
                        </div>

                        {/* Policy Details */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Premium</p>
                              <p className="font-semibold">${policy.premium} / {policy.frequency}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Coverage</p>
                              <p className="font-semibold">${policy.coverage.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        {(policy.phone || policy.email) && (
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4" />
                              <span className="font-semibold text-sm">Contact</span>
                            </div>
                            {policy.email && <p className="text-sm text-blue-600">{policy.email}</p>}
                            {policy.phone && <p className="text-sm">{policy.phone}</p>}
                          </div>
                        )}

                        {/* Document Section - ALWAYS show */}
                        <details className="mt-4">
                          <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            View Scanned Document
                          </summary>
                          <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border">
                            {policy.documentPhoto ? (
                              <img 
                                src={policy.documentPhoto} 
                                alt={`${policy.type} insurance document`}
                                className="w-full max-h-96 object-contain"
                                onError={(e) => {
                                  console.error('❌ Failed to load image:', policy.documentPhoto)
                                  console.error('Image URL:', policy.documentPhoto)
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg=='
                                }}
                              />
                            ) : (
                              <div className="text-center py-8">
                                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-sm text-gray-500 mb-4">No document attached yet</p>
                                <p className="text-xs text-gray-400">
                                  Upload a document by scanning with the orange upload button in the toolbar
                                </p>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDocuments(policy.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                          title="View Documents"
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleEditPolicy(policy.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'claims' && (
        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Claims Management</h2>
            <button
              onClick={onAddClaim}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              File Claim
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No claims filed yet</p>
              <button
                onClick={onAddClaim}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                File Claim
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map(claim => (
                <Card key={claim.id} className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">{claim.claimNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      claim.status === 'Approved' 
                        ? 'bg-green-100 text-green-700'
                        : claim.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Premium Payment Tracker</h2>
          
          <Card className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white mb-6">
            <p className="text-purple-100 mb-2">Total Annual Premium</p>
            <p className="text-6xl font-bold mb-2">${totalAnnual.toLocaleString()}</p>
            <p className="text-purple-100">Across all active policies</p>
          </Card>

          {policies.filter(p => p.status === 'Active').map(policy => (
            <Card key={policy.id} className="p-6 mb-4">
              <h3 className="text-xl font-bold mb-4">{policy.type} Insurance</h3>
              <p className="text-gray-600 mb-4">{policy.provider}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Frequency</p>
                  <p className="text-lg font-bold">{policy.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Premium Amount</p>
                  <p className="text-lg font-bold">${policy.premium}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Annual Cost</p>
                  <p className="text-lg font-bold text-purple-600">
                    ${(policy.premium * (policy.frequency === 'Monthly' ? 12 : policy.frequency === 'Quarterly' ? 4 : 1)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Payment</p>
                  <p className="text-lg font-bold">{new Date(policy.validUntil).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </Card>
      )}
    </div>
  )
}

