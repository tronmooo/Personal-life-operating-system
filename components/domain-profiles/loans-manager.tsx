'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { DollarSign, Plus, Trash2, Home, Car, CreditCard, GraduationCap, TrendingDown, Calendar } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format } from 'date-fns'

interface Loan {
  id: string
  name: string
  type: 'mortgage' | 'auto' | 'personal' | 'student' | 'credit_card' | 'business' | 'other'
  principal: number // Original loan amount
  currentBalance: number // Remaining balance
  interestRate: number // Annual interest rate (%)
  monthlyPayment: number
  startDate: string
  termMonths: number // Total loan term in months
  lender: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const LOAN_TYPES = [
  { value: 'mortgage', label: 'Home Mortgage', icon: Home, color: 'text-blue-500' },
  { value: 'auto', label: 'Auto Loan', icon: Car, color: 'text-green-500' },
  { value: 'personal', label: 'Personal Loan', icon: CreditCard, color: 'text-purple-500' },
  { value: 'student', label: 'Student Loan', icon: GraduationCap, color: 'text-orange-500' },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard, color: 'text-red-500' },
  { value: 'business', label: 'Business Loan', icon: DollarSign, color: 'text-indigo-500' },
  { value: 'other', label: 'Other Loan', icon: TrendingDown, color: 'text-gray-500' }
]

export function LoansManager() {
  const { addData, data, updateData, deleteData } = useData()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Load loans from Supabase-backed financial domain data
  const loans: Loan[] = (data.financial || [])
    .filter((item: any) => item.metadata?.logType === 'loan')
    .map((item: any) => ({
      id: item.metadata?.loanId || item.id,
      name: item.metadata?.name || item.title?.split(' - ')[1] || '',
      type: item.metadata?.loanType || 'other',
      principal: item.metadata?.principal || 0,
      currentBalance: item.metadata?.currentBalance || 0,
      interestRate: item.metadata?.interestRate || 0,
      monthlyPayment: item.metadata?.monthlyPayment || 0,
      startDate: item.metadata?.startDate || item.created_at || new Date().toISOString(),
      termMonths: item.metadata?.termMonths || 360,
      lender: item.metadata?.lender || '',
      notes: item.metadata?.notes || '',
      createdAt: item.created_at,
      updatedAt: item.updated_at || item.created_at
    }))
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'mortgage' as Loan['type'],
    principal: '',
    currentBalance: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    termMonths: '',
    lender: '',
    notes: ''
  })

  const handleSave = () => {
    if (!formData.name || !formData.principal || !formData.currentBalance || !formData.interestRate) {
      alert('Please fill in all required fields')
      return
    }

    const loan: Loan = {
      id: editingId || `loan-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      principal: parseFloat(formData.principal),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      monthlyPayment: parseFloat(formData.monthlyPayment) || 0,
      startDate: formData.startDate,
      termMonths: parseInt(formData.termMonths) || 360,
      lender: formData.lender,
      notes: formData.notes,
      createdAt: editingId ? loans.find(l => l.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to Supabase via financial domain
    const domainData = {
      title: `${loan.type.charAt(0).toUpperCase() + loan.type.slice(1)} Loan - ${loan.name}`,
      description: `Balance: $${loan.currentBalance.toLocaleString()} | Rate: ${loan.interestRate}% | Payment: $${loan.monthlyPayment.toLocaleString()}/mo`,
      metadata: {
        logType: 'loan',
        loanId: loan.id,
        name: loan.name,
        loanType: loan.type,
        principal: loan.principal,
        currentBalance: loan.currentBalance,
        interestRate: loan.interestRate,
        monthlyPayment: loan.monthlyPayment,
        startDate: loan.startDate,
        termMonths: loan.termMonths,
        lender: loan.lender,
        notes: loan.notes
      }
    }

    if (editingId) {
      // Find the domain item ID to update
      const existingItem = data.financial?.find((item: any) => item.metadata?.loanId === editingId)
      if (existingItem) {
        updateData('financial' as any, existingItem.id, domainData)
      }
    } else {
      addData('financial' as any, domainData)
    }
    
    // Also create/update a bill for the monthly payment via DataProvider
    if (loan.monthlyPayment > 0) {
      const bills = data.bills || []
      const existingBillIndex = bills.findIndex((b: any) => b.loanId === loan.id)
      
      // Calculate due date (use start date day, or default to 1st of month)
      const startDateObj = new Date(loan.startDate)
      const dueDay = startDateObj.getDate()
      
      const billData = {
        title: `${loan.name} Payment`,
        description: `Monthly payment for ${loan.type} loan`,
        metadata: {
          amount: loan.monthlyPayment,
          dueDate: dueDay,
          category: 'loan',
          frequency: 'monthly',
          status: 'pending',
          autoPay: false,
          loanId: loan.id
        }
      }
      
      if (existingBillIndex >= 0) {
        const billId = bills[existingBillIndex].id
        updateData('financial' as any, billId, billData)
      } else {
        addData('financial' as any, {
          ...billData,
          metadata: {
            ...billData.metadata,
            logType: 'bill'
          }
        })
      }
    }

    // Reset form
    setFormData({
      name: '',
      type: 'mortgage',
      principal: '',
      currentBalance: '',
      interestRate: '',
      monthlyPayment: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      termMonths: '',
      lender: '',
      notes: ''
    })
    setIsAdding(false)
    setEditingId(null)
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('loans-updated'))
  }

  const handleEdit = (loan: Loan) => {
    setFormData({
      name: loan.name,
      type: loan.type,
      principal: loan.principal.toString(),
      currentBalance: loan.currentBalance.toString(),
      interestRate: loan.interestRate.toString(),
      monthlyPayment: loan.monthlyPayment.toString(),
      startDate: loan.startDate,
      termMonths: loan.termMonths.toString(),
      lender: loan.lender,
      notes: loan.notes || ''
    })
    setEditingId(loan.id)
    setIsAdding(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      // Find and delete the domain item
      const existingItem = data.financial?.find((item: any) => item.metadata?.loanId === id)
      if (existingItem) {
        deleteData('financial' as any, existingItem.id)
      }
      
      // Also remove associated bill
      const bills = data.bills || []
      const associatedBill = bills.find((b: any) => b.metadata?.loanId === id)
      if (associatedBill) {
        deleteData('financial' as any, associatedBill.id)
      }
    }
  }

  const calculatePayoffProgress = (loan: Loan) => {
    const paid = loan.principal - loan.currentBalance
    return (paid / loan.principal) * 100
  }

  const calculateMonthsRemaining = (loan: Loan) => {
    if (loan.monthlyPayment === 0) return 0
    return Math.ceil(loan.currentBalance / loan.monthlyPayment)
  }

  const calculateTotalInterest = (loan: Loan) => {
    const monthlyRate = loan.interestRate / 100 / 12
    const totalPayments = loan.monthlyPayment * loan.termMonths
    return totalPayments - loan.principal
  }

  const totalDebt = loans.reduce((sum, loan) => sum + loan.currentBalance, 0)
  const totalMonthlyPayments = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalDebt.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loans.length} active {loans.length === 1 ? 'loan' : 'loans'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalMonthlyPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loans.length > 0 
                ? (loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length).toFixed(2)
                : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all loans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Loan Button */}
      {!isAdding && (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Loan
        </Button>
      )}

      {/* Add/Edit Loan Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Loan' : 'Add New Loan'}</CardTitle>
            <CardDescription>Track your loans and calculate payoff schedules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Loan Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Primary Home Mortgage"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Loan Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal">Original Loan Amount *</Label>
                <Input
                  id="principal"
                  type="number"
                  placeholder="500000"
                  value={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentBalance">Current Balance *</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  placeholder="450000"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  placeholder="3.5"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  placeholder="2500"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termMonths">Loan Term (months)</Label>
                <Input
                  id="termMonths"
                  type="number"
                  placeholder="360 (30 years)"
                  value={formData.termMonths}
                  onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lender">Lender</Label>
                <Input
                  id="lender"
                  placeholder="e.g., Chase Bank"
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {editingId ? 'Update Loan' : 'Add Loan'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                setFormData({
                  name: '',
                  type: 'mortgage',
                  principal: '',
                  currentBalance: '',
                  interestRate: '',
                  monthlyPayment: '',
                  startDate: format(new Date(), 'yyyy-MM-dd'),
                  termMonths: '',
                  lender: '',
                  notes: ''
                })
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loans List */}
      <div className="space-y-4">
        {loans.map((loan) => {
          const loanType = LOAN_TYPES.find(t => t.value === loan.type)
          const Icon = loanType?.icon || DollarSign
          const progress = calculatePayoffProgress(loan)
          const monthsRemaining = calculateMonthsRemaining(loan)
          const totalInterest = calculateTotalInterest(loan)

          return (
            <Card key={loan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${loanType?.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{loan.name}</CardTitle>
                      <CardDescription>{loanType?.label} • {loan.lender}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(loan)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(loan.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Payoff Progress</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Loan Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-bold text-red-600">
                      ${loan.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Payment</p>
                    <p className="text-lg font-bold">
                      ${loan.monthlyPayment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest Rate</p>
                    <p className="text-lg font-bold">
                      {loan.interestRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Months Remaining</p>
                    <p className="text-lg font-bold">
                      {monthsRemaining}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Original:</span>
                    <span className="font-medium">${loan.principal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Paid Off:</span>
                    <span className="font-medium">${(loan.principal - loan.currentBalance).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">{format(new Date(loan.startDate), 'MMM yyyy')}</span>
                  </div>
                  {totalInterest > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Interest:</span>
                      <span className="font-medium text-orange-600">${totalInterest.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {loan.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{loan.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {loans.length === 0 && !isAdding && (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Loans Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your loans to calculate payoff schedules and monitor your debt.
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Loan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


