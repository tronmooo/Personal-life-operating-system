'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, TrendingUp, Receipt, Wallet, CreditCard, 
  Calendar, Target, BarChart3
} from 'lucide-react'

// Provider
import { FinanceProvider } from '@/lib/providers/finance-provider-new'

// Tab components
import { DashboardTab } from '@/components/finance/tabs/dashboard-tab-new'
import { TransactionsTab } from '@/components/finance/tabs/transactions-tab-new'
import { AssetsTab } from '@/components/finance/tabs/assets-tab-new'
import { DebtsTab } from '@/components/finance/tabs/debts-tab-new'
import { BillsTab } from '@/components/finance/tabs/bills-tab-new'
import { BudgetTab } from '@/components/finance/tabs/budget-tab-new'
import { AnalysisTab } from '@/components/finance/tabs/analysis-tab-new'

// Dialogs
import { TransactionDialog } from '@/components/finance/dialogs/transaction-dialog-new'
import { RecurringTransactionDialog } from '@/components/finance/dialogs/recurring-transaction-dialog-new'
import { AssetDialog } from '@/components/finance/dialogs/asset-dialog-new'
import { InvestmentDialog } from '@/components/finance/dialogs/investment-dialog-new'
import { DebtDialog } from '@/components/finance/dialogs/debt-dialog-new'
import { BillDialog } from '@/components/finance/dialogs/bill-dialog-new'
import { BudgetDialog } from '@/components/finance/dialogs/budget-dialog-new'

// FAB Menu
import { FABMenu } from '@/components/finance/fab-menu-new'

type Tab = 'dashboard' | 'transactions' | 'assets' | 'debts' | 'bills' | 'budget' | 'analysis'

function FinancePageContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  
  // Dialog states
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false)
  const [debtDialogOpen, setDebtDialogOpen] = useState(false)
  const [billDialogOpen, setBillDialogOpen] = useState(false)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: TrendingUp },
    { id: 'transactions' as const, label: 'Transactions', icon: Receipt },
    { id: 'assets' as const, label: 'Assets', icon: Wallet },
    { id: 'debts' as const, label: 'Debts', icon: CreditCard },
    { id: 'bills' as const, label: 'Bills', icon: Calendar },
    { id: 'budget' as const, label: 'Budget', icon: Target },
    { id: 'analysis' as const, label: 'Analysis', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/domains')}
                className="p-2 rounded-lg hover:bg-slate-800 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Financial Command Center
                </h1>
                <p className="text-sm text-slate-400">
                  Your complete financial dashboard for clarity and control
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[73px] z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        
        {activeTab === 'transactions' && (
          <TransactionsTab 
            onOpenTransactionDialog={() => setTransactionDialogOpen(true)}
            onOpenRecurringDialog={() => setRecurringDialogOpen(true)}
          />
        )}
        
        {activeTab === 'assets' && (
          <AssetsTab 
            onOpenAssetDialog={() => setAssetDialogOpen(true)}
            onOpenInvestmentDialog={() => setInvestmentDialogOpen(true)}
          />
        )}
        
        {activeTab === 'debts' && (
          <DebtsTab onOpenDebtDialog={() => setDebtDialogOpen(true)} />
        )}
        
        {activeTab === 'bills' && (
          <BillsTab onOpenBillDialog={() => setBillDialogOpen(true)} />
        )}
        
        {activeTab === 'budget' && (
          <BudgetTab onOpenBudgetDialog={() => setBudgetDialogOpen(true)} />
        )}
        
        {activeTab === 'analysis' && <AnalysisTab />}
      </div>

      {/* Floating Action Button Menu */}
      <FABMenu 
        activeTab={activeTab}
        onAddTransaction={() => setTransactionDialogOpen(true)}
        onAddAsset={() => setAssetDialogOpen(true)}
        onAddInvestment={() => setInvestmentDialogOpen(true)}
        onAddDebt={() => setDebtDialogOpen(true)}
        onAddBill={() => setBillDialogOpen(true)}
        onAddBudget={() => setBudgetDialogOpen(true)}
      />

      {/* Dialogs */}
      <TransactionDialog 
        open={transactionDialogOpen} 
        onOpenChange={setTransactionDialogOpen} 
      />
      <RecurringTransactionDialog 
        open={recurringDialogOpen} 
        onOpenChange={setRecurringDialogOpen} 
      />
      <AssetDialog 
        open={assetDialogOpen} 
        onOpenChange={setAssetDialogOpen} 
      />
      <InvestmentDialog 
        open={investmentDialogOpen} 
        onOpenChange={setInvestmentDialogOpen} 
      />
      <DebtDialog 
        open={debtDialogOpen} 
        onOpenChange={setDebtDialogOpen} 
      />
      <BillDialog 
        open={billDialogOpen} 
        onOpenChange={setBillDialogOpen} 
      />
      <BudgetDialog 
        open={budgetDialogOpen} 
        onOpenChange={setBudgetDialogOpen} 
      />
    </div>
  )
}

export default function FinancePage() {
  return (
    <FinanceProvider>
      <FinancePageContent />
    </FinanceProvider>
  )
}
