'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, HelpCircle, Receipt, Wallet, CreditCard, Calendar, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABMenuProps {
  activeTab: string
  onAddTransaction?: () => void
  onAddAsset?: () => void
  onAddInvestment?: () => void
  onAddDebt?: () => void
  onAddBill?: () => void
  onAddBudget?: () => void
}

export function FABMenu({ 
  activeTab, 
  onAddTransaction,
  onAddAsset,
  onAddInvestment,
  onAddDebt,
  onAddBill,
  onAddBudget
}: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleMainAction = () => {
    switch (activeTab) {
      case 'transactions':
        onAddTransaction?.()
        break
      case 'assets':
        setIsOpen(!isOpen)
        break
      case 'debts':
        onAddDebt?.()
        break
      case 'bills':
        onAddBill?.()
        break
      case 'budget':
        onAddBudget?.()
        break
      default:
        setIsOpen(!isOpen)
    }
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Expanded Menu Options */}
      {isOpen && activeTab === 'assets' && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-lg"
            onClick={() => {
              onAddInvestment?.()
              setIsOpen(false)
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
          <Button
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-lg"
            onClick={() => {
              onAddAsset?.()
              setIsOpen(false)
            }}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      )}
      
      {/* Main FAB Button */}
      <Button
        size="lg"
        className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/50"
        onClick={handleMainAction}
      >
        <Plus className={cn("h-6 w-6 transition-transform", isOpen && "rotate-45")} />
      </Button>
      
      {/* Helper Icon */}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </div>
  )
}
