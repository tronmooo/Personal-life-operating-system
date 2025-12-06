'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Edit, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { AddClaimDialog } from './add-claim-dialog'
import { useInsurance } from '@/lib/hooks/use-insurance'

export function ClaimsTab() {
  const { claims, deleteClaim } = useInsurance()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this claim?')) return
    try {
      await deleteClaim(id)
    } catch (error) {
      console.error('Failed to delete claim:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      'Approved': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      'Denied': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      'In Review': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Claims Management</h2>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            File Claim
          </Button>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No claims filed yet</p>
            <p className="text-sm text-gray-500">Click "File Claim" to submit a new claim</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim: any) => (
              <Card 
                key={claim.id}
                className="p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{claim.details?.claimNumber || claim.id.slice(0,8)}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status || 'Pending')}`}>
                        {claim.status || 'Pending'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {claim.details?.policy_type || 'Policy'} - {claim.details?.policy_number || '—'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Claim Date</p>
                        <p className="font-semibold">{claim.filed_on ? format(new Date(claim.filed_on), 'MM/dd/yyyy') : '—'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Claim Amount</p>
                        <p className="font-semibold">${Number(claim.amount || 0).toLocaleString()}</p>
                      </div>
                      
                      {claim.details?.approvedAmount !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Approved Amount</p>
                          <p className="font-semibold">{Number(claim.details.approvedAmount).toLocaleString()}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Provider</p>
                        <p className="font-semibold">{claim.details?.provider || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                      <p className="text-sm">{claim.details?.description || '—'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(claim.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <AddClaimDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  )
}
