// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider'
import { Plus, Calendar, DollarSign, CheckCircle } from 'lucide-react'
import { formatCurrency, formatCurrencyDetailed } from '@/lib/utils/finance-utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FREQUENCY_LABELS } from '@/types/finance'
import { format } from 'date-fns'
import { BillDialog } from '../dialogs/bill-dialog'

export function BillsTab() {
  const { bills, billSummary, billsLoading } = useFinance()
  const [billDialogOpen, setBillDialogOpen] = useState(false)
  
  const activeBills = bills.filter(b => b.status === 'active')
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bills</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billSummary?.upcomingBillsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Bills due soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(billSummary?.totalAmountDue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Pay Enabled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billSummary?.autoPayCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Automated payments
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recurring Bills & Insurance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recurring Bills & Insurance</CardTitle>
              <CardDescription>Manage your regular payments and policies</CardDescription>
            </div>
            <Button onClick={() => setBillDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Auto-Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading bills...
                    </TableCell>
                  </TableRow>
                ) : activeBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No bills added yet. Track your recurring payments and subscriptions.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bill.name}</p>
                          <p className="text-xs text-muted-foreground">{bill.provider}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{bill.category}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrencyDetailed(Number(bill.amount))}
                        <p className="text-xs text-muted-foreground">
                          {FREQUENCY_LABELS[bill.frequency]}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {bill.due_date}
                      </TableCell>
                      <TableCell>
                        {bill.is_autopay ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bill.status === 'active' ? 'default' : 'secondary'}>
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {bill.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <BillDialog open={billDialogOpen} onOpenChange={setBillDialogOpen} />
    </div>
  )
}

