// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider'
import { Plus, CreditCard, AlertCircle } from 'lucide-react'
import { formatCurrency, formatCurrencyDetailed, formatPercentage } from '@/lib/utils/finance-utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DEBT_TYPE_LABELS } from '@/types/finance'
import { Progress } from '@/components/ui/progress'
import { DebtDialog } from '../dialogs/debt-dialog'

export function DebtsTab() {
  const { debts, debtSummary, debtsLoading } = useFinance()
  const [debtDialogOpen, setDebtDialogOpen] = useState(false)
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(debtSummary?.totalDebt || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Minimum Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(debtSummary?.monthlyMinimumPayments || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Required each month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Interest Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPercentage(debtSummary?.highestInterestRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Priority for payoff
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Liabilities Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liabilities</CardTitle>
              <CardDescription>All debts and what you owe</CardDescription>
            </div>
            <Button onClick={() => setDebtDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Liability
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creditor</TableHead>
                  <TableHead>Loan Type</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Min Payment</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading debts...
                    </TableCell>
                  </TableRow>
                ) : debts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
                      <p className="text-muted-foreground">
                        Great! No debts recorded. Keep up the debt-free lifestyle!
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  debts.map((debt) => {
                    const payoffProgress = ((Number(debt.original_amount) - Number(debt.current_balance)) / Number(debt.original_amount)) * 100
                    
                    return (
                      <TableRow key={debt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{debt.name}</p>
                            <p className="text-xs text-muted-foreground">{debt.creditor}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {DEBT_TYPE_LABELS[debt.type] || debt.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            Number(debt.interest_rate) > 15 ? 'text-red-600' : 
                            Number(debt.interest_rate) > 7 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {formatPercentage(Number(debt.interest_rate))}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatCurrencyDetailed(Number(debt.original_amount))}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{formatCurrencyDetailed(Number(debt.current_balance))}</p>
                            <Progress value={payoffProgress} className="h-1" />
                            <p className="text-xs text-muted-foreground">{payoffProgress.toFixed(0)}% paid off</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrencyDetailed(Number(debt.minimum_payment))}
                        </TableCell>
                        <TableCell className="text-sm">{debt.due_date}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Debt Payoff Strategy */}
      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debt Payoff Progress</CardTitle>
            <CardDescription>Current balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debts.map((debt) => {
                const payoffProgress = ((Number(debt.original_amount) - Number(debt.current_balance)) / Number(debt.original_amount)) * 100
                const remaining = Number(debt.current_balance)
                
                return (
                  <div key={debt.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{debt.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrencyDetailed(remaining)} remaining • {formatPercentage(Number(debt.interest_rate))} APR
                        </p>
                      </div>
                      <Badge variant={Number(debt.interest_rate) > 15 ? 'destructive' : 'secondary'}>
                        {Number(debt.interest_rate) > 15 ? 'High Interest' : 'On Track'}
                      </Badge>
                    </div>
                    <Progress value={payoffProgress} className="h-2" />
                    <p className="text-xs text-right text-muted-foreground">
                      {payoffProgress.toFixed(1)}% complete
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Dialogs */}
      <DebtDialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen} />
    </div>
  )
}

import { DollarSign, CheckCircle2 } from 'lucide-react'

