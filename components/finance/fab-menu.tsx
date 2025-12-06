'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, Receipt, Wallet, CreditCard, Calendar, Target, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransactionDialog } from './dialogs/transaction-dialog'
import { AccountDialog } from './dialogs/account-dialog'
import { AssetDialog } from './dialogs/asset-dialog'
import { DebtDialog } from './dialogs/debt-dialog'
import { BillDialog } from './dialogs/bill-dialog'
import { GoalDialog } from './dialogs/goal-dialog'

export function FABMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  
  const quickActions = [
    { id: 'transaction', label: 'Transaction', icon: Receipt, color: 'bg-blue-600' },
    { id: 'account', label: 'Account', icon: Building2, color: 'bg-purple-600' },
    { id: 'asset', label: 'Asset', icon: Wallet, color: 'bg-green-600' },
    { id: 'debt', label: 'Debt', icon: CreditCard, color: 'bg-red-600' },
    { id: 'bill', label: 'Bill', icon: Calendar, color: 'bg-orange-600' },
    { id: 'goal', label: 'Goal', icon: Target, color: 'bg-pink-600' }
  ]
  
  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick Action Buttons */}
        <div className={cn(
          "absolute bottom-16 right-0 flex flex-col gap-2 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                onClick={() => {
                  setActiveDialog(action.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "h-12 px-4 shadow-lg",
                  action.color,
                  "text-white hover:opacity-90"
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                }}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            )
          })}
        </div>
        
        {/* Main FAB */}
        <Button
          size="lg"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
            "bg-blue-600 hover:bg-blue-700 text-white",
            isOpen && "rotate-45"
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Dialogs */}
      <TransactionDialog 
        open={activeDialog === 'transaction'} 
        onOpenChange={(open) => !open && setActiveDialog(null)} 
      />
      <AccountDialog 
        open={activeDialog === 'account'} 
        onOpenChange={(open) => !open && setActiveDialog(null)} 
      />
      <AssetDialog 
        open={activeDialog === 'asset'} 
        onOpenChange={(open) => !open && setActiveDialog(null)} 
      />
      <DebtDialog 
        open={activeDialog === 'debt'} 
        onOpenChange={(open) => !open && setActiveDialog(null)} 
      />
      <BillDialog 
        open={activeDialog === 'bill'} 
        onOpenChange={(open) => !open && setActiveDialog(null)} 
      />
      <GoalDialog 
        open={activeDialog === 'goal'} 
        onOpenChange={(open) => !open && setActiveDialog(null)} 
      />
    </>
  )
}

