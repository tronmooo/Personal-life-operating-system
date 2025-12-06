'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, DollarSign, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Cost {
  id: string
  description: string
  amount: number
  date: string
  category: string
}

interface CostsTabProps {
  petId: string
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export function CostsTab({ petId }: CostsTabProps) {
  const { getData, addData, deleteData } = useData()
  const [costs, setCosts] = useState<Cost[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Veterinary Care'
  })

  useEffect(() => {
    loadCosts()
    
    const handleUpdate = () => loadCosts()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('pets-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('pets-data-updated', handleUpdate)
    }
  }, [petId])

  const loadCosts = async () => {
    try {
      // Fetch costs from dedicated API endpoint
      const response = await fetch(`/api/pets/costs?petId=${petId}`)
      if (!response.ok) {
        console.error('Failed to load costs')
        setCosts([])
        return
      }

      const { costs: apiCosts } = await response.json()
      
      const petCosts = (apiCosts || []).map((cost: any) => ({
        id: cost.id,
        description: String(cost.description || ''),
        amount: Number(cost.amount) || 0,
        date: String(cost.date || ''),
        category: cost.cost_type ? capitalizeCategory(cost.cost_type) : 'Other'
      }))
      .sort((a: any, b: any) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())
      
      setCosts(petCosts)
    } catch (error) {
      console.error('Error loading costs:', error)
      setCosts([])
    }
  }

  // Helper to convert database cost_type to UI category
  const capitalizeCategory = (costType: string): string => {
    const typeMap: Record<string, string> = {
      'vet': 'Veterinary Care',
      'food': 'Food',
      'grooming': 'Grooming',
      'supplies': 'Supplies',
      'boarding': 'Boarding',
      'training': 'Training',
      'other': 'Other'
    }
    return typeMap[costType] || 'Other'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.amount) {
      alert('Please fill in description and amount')
      return
    }

    try {
      // Map UI category to database cost_type
      const categoryMap: Record<string, string> = {
        'Veterinary Care': 'vet',
        'Food': 'food',
        'Grooming': 'grooming',
        'Supplies': 'supplies',
        'Boarding': 'boarding',
        'Training': 'training',
        'Other': 'other'
      }
      const cost_type = categoryMap[formData.category] || 'other'

      // Use dedicated pet_costs API endpoint
      const response = await fetch('/api/pets/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: petId,
          cost_type,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description,
          vendor: null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save cost')
      }

      console.log('✅ Pet cost saved to database')
      loadCosts()

      // Notify pets list page to update counters
      window.dispatchEvent(new CustomEvent('pets-data-updated'))

      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Veterinary Care'
      })
      setShowDialog(false)
    } catch (error: any) {
      console.error('Error saving pet cost:', error)
      alert(`Failed to save cost: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost?')) return
    
    try {
      const response = await fetch(`/api/pets/costs?costId=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete cost')
      }

      loadCosts()
      window.dispatchEvent(new CustomEvent('pets-data-updated'))
    } catch (error: any) {
      console.error('Error deleting cost:', error)
      alert(`Failed to delete cost: ${error.message}`)
    }
  }

  const totalExpenses = costs.reduce((sum, cost) => sum + cost.amount, 0)

  // Prepare pie chart data
  const chartData = costs.reduce((acc, cost) => {
    const existing = acc.find(item => item.name === cost.category)
    if (existing) {
      existing.value += cost.amount
    } else {
      acc.push({ name: cost.category, value: cost.amount })
    }
    return acc
  }, [] as { name: string; value: number }[])

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Vet Visit, Food, Toys"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Veterinary Care, Food"
              />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Cost
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Cost
        </Button>

        {/* Total Expenses Card */}
        <Card className="p-6 bg-purple-50 dark:bg-purple-900/20">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <p className="text-4xl font-bold text-purple-600">${totalExpenses.toFixed(2)}</p>
        </Card>

        {/* Pie Chart */}
        {costs.length > 0 && chartData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Costs List */}
        {costs.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Costs</h3>
            <div className="space-y-3">
              {costs.map((cost) => (
                <div 
                  key={cost.id} 
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{cost.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {cost.category} • {new Date(cost.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-purple-600">
                      ${cost.amount.toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cost.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {costs.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No costs recorded yet</p>
          </div>
        )}
      </div>
    </>
  )
}

