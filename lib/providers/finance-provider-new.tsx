'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { toast } from 'sonner'
import type {
  FinanceContextType,
  Transaction,
  FinancialAccount,
  Asset,
  Investment,
  Debt,
  Bill,
  BudgetCategory,
  FinancialGoal,
  RecurringTransaction,
  TaxDeduction,
  FinancialSummary,
  DebtSummary,
  BillSummary,
  InvestmentPortfolio,
  MonthlyBudgetSummary,
  FinancialInsight,
  TransactionFormData,
  AccountFormData,
  AssetFormData,
  InvestmentFormData,
  DebtFormData,
  BillFormData,
  BudgetItemFormData,
  GoalFormData,
  RecurringTransactionFormData,
  ExportData,
  NetWorthProjection,
  TaxSummary,
  SpendingTrend,
  DailySpending
} from '@/types/finance'

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { items, create, update, remove, loading } = useDomainCRUD('financial')
  
  // Parse all financial items by type
  const transactions = useMemo<Transaction[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'transaction')
      .map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.metadata?.type || 'expense',
        category: item.metadata?.category || 'Uncategorized',
        subcategory: item.metadata?.subcategory,
        amount: Number(item.metadata?.amount || 0),
        date: item.metadata?.date || item.createdAt || item.created_at,
        account: item.metadata?.account,
        payee: item.metadata?.payee,
        payer: item.metadata?.payer,
        tags: item.metadata?.tags || [],
        paymentMethod: item.metadata?.paymentMethod,
        status: item.metadata?.status,
        receiptUrl: item.metadata?.receiptUrl,
        notes: item.metadata?.notes,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at
      }))
  }, [items])

  const accounts = useMemo<FinancialAccount[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'account')
      .map(item => ({
        id: item.id,
        name: item.title,
        accountType: item.metadata?.accountType || 'checking',
        institution: item.metadata?.institution || '',
        accountNumber: item.metadata?.accountNumber,
        balance: Number(item.metadata?.balance || 0),
        interestRate: item.metadata?.interestRate,
        creditLimit: item.metadata?.creditLimit,
        openDate: item.metadata?.openDate,
        lastUpdated: item.metadata?.lastUpdated || item.updatedAt || item.updated_at,
        isActive: item.metadata?.isActive !== false,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at
      }))
  }, [items])

  const assets = useMemo<Asset[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'asset')
      .map(item => ({
        id: item.id,
        name: item.title,
        assetType: item.metadata?.assetType || 'other',
        currentValue: Number(item.metadata?.currentValue || 0),
        purchasePrice: item.metadata?.purchasePrice,
        purchaseDate: item.metadata?.purchaseDate,
        lastUpdated: item.metadata?.lastUpdated || item.updatedAt || item.updated_at,
        notes: item.metadata?.notes,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at
      }))
  }, [items])

  const investments = useMemo<Investment[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'investment')
      .map(item => {
        const quantity = Number(item.metadata?.quantity || 0)
        const purchasePrice = Number(item.metadata?.purchasePrice || 0)
        const currentPrice = Number(item.metadata?.currentPrice || 0)
        const totalCost = quantity * purchasePrice
        const totalValue = quantity * currentPrice
        const gainLoss = totalValue - totalCost
        const returnPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0

        return {
          id: item.id,
          name: item.title,
          symbol: item.metadata?.symbol || '',
          quantity,
          purchasePrice,
          currentPrice,
          purchaseDate: item.metadata?.purchaseDate || item.createdAt || item.created_at,
          broker: item.metadata?.broker,
          investmentType: item.metadata?.investmentType,
          totalValue,
          totalCost,
          gainLoss,
          returnPercent,
          created_at: item.createdAt || item.created_at,
          updated_at: item.updatedAt || item.updated_at
        }
      })
  }, [items])

  const debts = useMemo<Debt[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'debt')
      .map(item => ({
        id: item.id,
        name: item.title,
        creditor: item.metadata?.creditor || '',
        loanType: item.metadata?.loanType || 'personal',
        interestRate: Number(item.metadata?.interestRate || 0),
        originalBalance: Number(item.metadata?.originalBalance || 0),
        currentBalance: Number(item.metadata?.currentBalance || 0),
        minimumPayment: Number(item.metadata?.minimumPayment || 0),
        dueDate: item.metadata?.dueDate || '',
        accountNumber: item.metadata?.accountNumber,
        termMonths: item.metadata?.termMonths,
        monthsRemaining: item.metadata?.monthsRemaining,
        payoffDate: item.metadata?.payoffDate,
        isAutoPay: item.metadata?.isAutoPay || false,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at
      }))
  }, [items])

  const bills = useMemo<Bill[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'bill')
      .map(item => ({
        id: item.id,
        name: item.title,
        provider: item.metadata?.provider || '',
        category: item.metadata?.category || 'other',
        amount: Number(item.metadata?.amount || 0),
        due_date: item.metadata?.dueDate || '',
        dueDate: item.metadata?.dueDate || '',
        recurring: item.metadata?.recurring !== false,
        frequency: item.metadata?.frequency,
        is_autopay: item.metadata?.isAutoPay || false,
        isAutoPay: item.metadata?.isAutoPay || false,
        status: item.metadata?.status || 'pending',
        account: item.metadata?.account,
        website: item.metadata?.website,
        lastPaidDate: item.metadata?.lastPaidDate,
        nextDueDate: item.metadata?.nextDueDate,
        notes: item.metadata?.notes,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at
      }))
  }, [items])

  const budgetCategories = useMemo<BudgetCategory[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'budget')
      .map(item => {
        const budgeted = Number(item.metadata?.budgetedAmount || 0)
        const spent = Number(item.metadata?.spentAmount || 0)
        const variance = budgeted - spent
        const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0

        return {
          id: item.id,
          category: item.title,
          budgetedAmount: budgeted,
          spentAmount: spent,
          month: item.metadata?.month || '',
          year: Number(item.metadata?.year || new Date().getFullYear()),
          variance,
          percentUsed,
          rollover: item.metadata?.rollover,
          created_at: item.createdAt || item.created_at,
          updated_at: item.updatedAt || item.updated_at
        }
      })
  }, [items])

  const goals = useMemo<FinancialGoal[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'goal')
      .map(item => {
        const target = Number(item.metadata?.targetAmount || 0)
        const current = Number(item.metadata?.currentAmount || 0)
        const progress = target > 0 ? (current / target) * 100 : 0

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          goalType: item.metadata?.goalType || 'savings',
          targetAmount: target,
          currentAmount: current,
          targetDate: item.metadata?.targetDate,
          monthlyContribution: item.metadata?.monthlyContribution,
          priority: item.metadata?.priority || 'medium',
          status: item.metadata?.status || 'active',
          progress,
          account: item.metadata?.account,
          created_at: item.createdAt || item.created_at,
          updated_at: item.updatedAt || item.updated_at
        }
      })
  }, [items])

  const recurringTransactions = useMemo<RecurringTransaction[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'recurring-transaction')
      .map(item => ({
        id: item.id,
        name: item.title,
        type: item.metadata?.type || 'expense',
        category: item.metadata?.category || '',
        amount: Number(item.metadata?.amount || 0),
        frequency: item.metadata?.frequency || 'monthly',
        startDate: item.metadata?.startDate || item.createdAt || item.created_at,
        endDate: item.metadata?.endDate,
        account: item.metadata?.account || '',
        isActive: item.metadata?.isActive !== false,
        lastGenerated: item.metadata?.lastGenerated,
        nextGeneration: item.metadata?.nextGeneration,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at
      }))
  }, [items])

  const taxDeductions = useMemo<TaxDeduction[]>(() => {
    return items
      .filter(item => item.metadata?.itemType === 'tax-deduction')
      .map(item => ({
        id: item.id,
        deductionType: item.metadata?.deductionType || 'other',
        amount: Number(item.metadata?.amount || 0),
        date: item.metadata?.date || item.createdAt || item.created_at,
        year: Number(item.metadata?.year || new Date().getFullYear()),
        description: item.description,
        category: item.metadata?.category,
        receiptUrl: item.metadata?.receiptUrl,
        created_at: item.createdAt || item.created_at
      }))
  }, [items])

  // Calculate financial summary
  const financialSummary = useMemo<FinancialSummary | null>(() => {
    console.log('💰 [FinanceProvider] Calculating financial summary...')
    
    // Calculate total assets
    const liquidAssets = accounts
      .filter(a => ['checking', 'savings'].includes(a.accountType))
      .reduce((sum, a) => sum + a.balance, 0)
    
    const investmentAssets = accounts
      .filter(a => ['investment', 'retirement'].includes(a.accountType))
      .reduce((sum, a) => sum + a.balance, 0) + investments.reduce((sum, i) => sum + i.totalValue, 0)
    
    const realEstateAssets = assets
      .filter(a => a.assetType === 'real-estate')
      .reduce((sum, a) => sum + a.currentValue, 0)
    
    const otherAssets = assets
      .filter(a => a.assetType !== 'real-estate')
      .reduce((sum, a) => sum + a.currentValue, 0)
    
    const totalAssets = liquidAssets + investmentAssets + realEstateAssets + otherAssets
    
    console.log('💰 [FinanceProvider] Assets breakdown:', {
      liquidAssets,
      investmentAssets,
      realEstateAssets,
      otherAssets,
      totalAssets
    })

    // Calculate total liabilities
    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0)
    const creditCardDebt = debts
      .filter(d => d.loanType === 'credit-card')
      .reduce((sum, d) => sum + d.currentBalance, 0)
    const loanDebt = debts
      .filter(d => d.loanType !== 'credit-card')
      .reduce((sum, d) => sum + d.currentBalance, 0)
    const totalLiabilities = totalDebt
    
    console.log('💰 [FinanceProvider] Liabilities breakdown:', {
      totalDebt,
      creditCardDebt,
      loanDebt,
      totalLiabilities
    })

    // Calculate net worth
    const netWorth = totalAssets - totalLiabilities
    console.log('💰 [FinanceProvider] Net Worth:', netWorth)

    // Calculate monthly cash flow (current month)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlyIncome = transactions
      .filter(t => {
        const date = new Date(t.date)
        return t.type === 'income' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Calculate monthly expenses from transactions
    const transactionExpenses = transactions
      .filter(t => {
        const date = new Date(t.date)
        return t.type === 'expense' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Add recurring bills to monthly expenses
    const monthlyBillsTotal = bills
      .filter(b => b.recurring && b.frequency === 'monthly')
      .reduce((sum, b) => sum + b.amount, 0)
    
    const monthlyExpenses = transactionExpenses + monthlyBillsTotal
    
    console.log('💰 [FinanceProvider] Monthly cash flow:', {
      monthlyIncome,
      transactionExpenses,
      monthlyBillsTotal,
      totalMonthlyExpenses: monthlyExpenses,
      billsCount: bills.length
    })
    
    const monthlyCashFlow = monthlyIncome - monthlyExpenses

    // Calculate metrics
    const savingsRate = monthlyIncome > 0 ? (monthlyCashFlow / monthlyIncome) * 100 : 0
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0
    const emergencyFundMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0

    const summary = {
      totalAssets,
      liquidAssets,
      investmentAssets,
      realEstateAssets,
      otherAssets,
      totalLiabilities,
      totalDebt,
      creditCardDebt,
      loanDebt,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyCashFlow,
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      lastCalculated: new Date().toISOString()
    }
    
    console.log('💰 [FinanceProvider] Financial summary complete:', summary)
    return summary
  }, [accounts, assets, investments, debts, transactions, bills])

  // Calculate debt summary
  const debtSummary = useMemo<DebtSummary | null>(() => {
    if (debts.length === 0) return null

    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0)
    const totalMinimumPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0)
    const highestInterestDebt = debts.reduce((max, d) => 
      d.interestRate > max.interestRate ? d : max, debts[0]
    )
    const averageInterestRate = debts.reduce((sum, d) => sum + d.interestRate, 0) / debts.length

    const debtByType = debts.reduce((acc, d) => {
      acc[d.loanType] = (acc[d.loanType] || 0) + d.currentBalance
      return acc
    }, {} as Record<string, number>)

    return {
      totalDebt,
      totalMinimumPayments,
      highestInterestRate: highestInterestDebt.interestRate,
      highestInterestDebt,
      averageInterestRate,
      debtByType,
      monthlyPayments: totalMinimumPayments
    }
  }, [debts])

  // Calculate bill summary
  const billSummary = useMemo<BillSummary | null>(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const upcomingBills = bills.filter(bill => {
      const dueDate = new Date(bill.due_date)
      return dueDate >= now && dueDate <= thirtyDaysFromNow
    })

    const totalAmountDue = upcomingBills.reduce((sum, b) => sum + b.amount, 0)
    const autoPayCount = bills.filter(b => b.is_autopay).length
    const overdueCount = bills.filter(b => {
      const dueDate = new Date(b.due_date)
      return dueDate < now && b.status !== 'paid'
    }).length

    const monthlyRecurringTotal = bills
      .filter(b => b.recurring && b.frequency === 'monthly')
      .reduce((sum, b) => sum + b.amount, 0)

    const billsByCategory = bills.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + b.amount
      return acc
    }, {} as Record<string, number>)

    return {
      upcomingBillsCount: upcomingBills.length,
      totalAmountDue,
      autoPayCount,
      overdueCount,
      nextBills: upcomingBills.slice(0, 5),
      monthlyRecurringTotal,
      billsByCategory
    }
  }, [bills])

  // Calculate investment portfolio
  const investmentPortfolio = useMemo<InvestmentPortfolio | null>(() => {
    if (investments.length === 0) return null

    const totalValue = investments.reduce((sum, i) => sum + i.totalValue, 0)
    const totalCost = investments.reduce((sum, i) => sum + i.totalCost, 0)
    const totalGainLoss = totalValue - totalCost
    const returnPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    const byType = investments.reduce((acc, inv) => {
      const type = inv.investmentType || 'other'
      if (!acc[type]) {
        acc[type] = { value: 0, gainLoss: 0, returnPercent: 0 }
      }
      acc[type].value += inv.totalValue
      acc[type].gainLoss += inv.gainLoss
      const cost = inv.totalCost
      acc[type].returnPercent = cost > 0 ? (acc[type].gainLoss / cost) * 100 : 0
      return acc
    }, {} as Record<string, { value: number; gainLoss: number; returnPercent: number }>)

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalReturn: totalGainLoss,
      returnPercent,
      investments,
      byType
    }
  }, [investments])

  // Calculate monthly budget summary
  const monthlyBudget = useMemo<MonthlyBudgetSummary | null>(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const currentMonthBudgets = budgetCategories.filter(b => b.month === currentMonth)
    
    if (currentMonthBudgets.length === 0) return null

    const totalBudgeted = currentMonthBudgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
    const totalSpent = currentMonthBudgets.reduce((sum, b) => sum + b.spentAmount, 0)
    const variance = totalBudgeted - totalSpent
    const variancePercent = totalBudgeted > 0 ? (variance / totalBudgeted) * 100 : 0

    const overBudgetCategories = currentMonthBudgets
      .filter(b => b.spentAmount > b.budgetedAmount)
      .map(b => b.category)
    
    const underBudgetCategories = currentMonthBudgets
      .filter(b => b.spentAmount < b.budgetedAmount)
      .map(b => b.category)

    return {
      month: currentMonth,
      year: now.getFullYear(),
      totalBudgeted,
      totalSpent,
      variance,
      variancePercent,
      categories: currentMonthBudgets,
      overBudgetCategories,
      underBudgetCategories
    }
  }, [budgetCategories])

  // Generate insights
  const insights = useMemo<FinancialInsight[]>(() => {
    const generatedInsights: FinancialInsight[] = []

    // Emergency fund alert
    if (financialSummary) {
      if (financialSummary.emergencyFundMonths < 3) {
        generatedInsights.push({
          id: 'emergency-fund-alert',
          type: 'alert',
          title: 'Emergency Fund Alert',
          message: `You have ${financialSummary.emergencyFundMonths.toFixed(1)} months of expenses in liquid assets. Aim for 3-6 months.`,
          action: 'Prioritize building your emergency fund',
          priority: 'high',
          category: 'emergency-fund',
          createdAt: new Date().toISOString(),
          dismissible: true
        })
      }

      // High debt-to-income ratio
      if (financialSummary.debtToIncomeRatio > 50) {
        generatedInsights.push({
          id: 'debt-to-income-warning',
          type: 'warning',
          title: 'High Debt-to-Income Ratio',
          message: `Your debt-to-income ratio is ${financialSummary.debtToIncomeRatio.toFixed(1)}%. Aim for below 36%.`,
          action: 'Consider debt consolidation or increasing income',
          priority: 'high',
          category: 'debt',
          createdAt: new Date().toISOString(),
          dismissible: true
        })
      }

      // Negative cash flow
      if (financialSummary.monthlyCashFlow < 0) {
        generatedInsights.push({
          id: 'negative-cash-flow',
          type: 'alert',
          title: 'Negative Cash Flow',
          message: `You're spending $${Math.abs(financialSummary.monthlyCashFlow).toFixed(2)} more than you earn this month.`,
          action: 'Review expenses and find areas to cut back',
          priority: 'high',
          category: 'budget',
          createdAt: new Date().toISOString(),
          dismissible: true
        })
      }

      // Good savings rate
      if (financialSummary.savingsRate > 20) {
        generatedInsights.push({
          id: 'good-savings-rate',
          type: 'success',
          title: 'Great Savings Rate!',
          message: `You're saving ${financialSummary.savingsRate.toFixed(1)}% of your income. Keep it up!`,
          priority: 'low',
          category: 'savings',
          createdAt: new Date().toISOString(),
          dismissible: true
        })
      }
    }

    // Budget overruns
    if (monthlyBudget && monthlyBudget.overBudgetCategories.length > 0) {
      generatedInsights.push({
        id: 'budget-overrun',
        type: 'warning',
        title: 'Budget Categories Over Limit',
        message: `${monthlyBudget.overBudgetCategories.length} categories are over budget: ${monthlyBudget.overBudgetCategories.join(', ')}`,
        action: 'Review spending in these categories',
        priority: 'medium',
        category: 'budget',
        createdAt: new Date().toISOString(),
        dismissible: true
      })
    }

    // Upcoming bills
    if (billSummary && billSummary.upcomingBillsCount > 0) {
      generatedInsights.push({
        id: 'upcoming-bills',
        type: 'info',
        title: `${billSummary.upcomingBillsCount} Bills Due Soon`,
        message: `Total amount due: $${billSummary.totalAmountDue.toFixed(2)}`,
        priority: 'medium',
        category: 'bills',
        createdAt: new Date().toISOString(),
        dismissible: true
      })
    }

    return generatedInsights
  }, [financialSummary, monthlyBudget, billSummary])

  // CRUD Functions - Transactions
  const createTransaction = useCallback(async (data: TransactionFormData): Promise<Transaction | null> => {
    try {
      const entry = await create({
        title: data.title,
        description: data.description,
        metadata: {
          itemType: 'transaction',
          type: data.type,
          category: data.category,
          subcategory: data.subcategory,
          amount: data.amount,
          date: data.date,
          account: data.account,
          payee: data.payee,
          tags: data.tags,
          paymentMethod: data.paymentMethod,
          notes: data.notes
        }
      })
      
      if (entry) {
        toast.success('Transaction created successfully')
        return {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          type: data.type,
          category: data.category,
          subcategory: data.subcategory,
          amount: data.amount,
          date: data.date,
          account: data.account,
          payee: data.payee,
          tags: data.tags,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to create transaction')
      return null
    }
  }, [create])

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.title,
        description: data.description,
        metadata: {
          type: data.type,
          category: data.category,
          subcategory: data.subcategory,
          amount: data.amount,
          date: data.date,
          account: data.account,
          payee: data.payee,
          tags: data.tags,
          paymentMethod: data.paymentMethod,
          notes: data.notes
        }
      })
      toast.success('Transaction updated successfully')
      return true
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
      return false
    }
  }, [update])

  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      toast.success('Transaction deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
      return false
    }
  }, [remove])

  // CRUD Functions - Accounts
  const createAccount = useCallback(async (data: AccountFormData): Promise<FinancialAccount | null> => {
    try {
      const entry = await create({
        title: data.name,
        metadata: {
          itemType: 'account',
          accountType: data.accountType,
          institution: data.institution,
          accountNumber: data.accountNumber,
          balance: data.balance,
          interestRate: data.interestRate,
          creditLimit: data.creditLimit,
          openDate: data.openDate,
          lastUpdated: new Date().toISOString(),
          isActive: true
        }
      })
      
      if (entry) {
        toast.success('Account created successfully')
        return {
          id: entry.id,
          name: entry.title,
          accountType: data.accountType,
          institution: data.institution,
          accountNumber: data.accountNumber,
          balance: data.balance,
          interestRate: data.interestRate,
          creditLimit: data.creditLimit,
          openDate: data.openDate,
          lastUpdated: new Date().toISOString(),
          isActive: true,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error('Failed to create account')
      return null
    }
  }, [create])

  const updateAccount = useCallback(async (id: string, data: Partial<AccountFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.name,
        metadata: {
          accountType: data.accountType,
          institution: data.institution,
          accountNumber: data.accountNumber,
          balance: data.balance,
          interestRate: data.interestRate,
          creditLimit: data.creditLimit,
          openDate: data.openDate,
          lastUpdated: new Date().toISOString()
        }
      })
      toast.success('Account updated successfully')
      return true
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error('Failed to update account')
      return false
    }
  }, [update])

  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      toast.success('Account deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
      return false
    }
  }, [remove])

  // CRUD Functions - Assets
  const createAsset = useCallback(async (data: AssetFormData): Promise<Asset | null> => {
    try {
      const entry = await create({
        title: data.name,
        metadata: {
          itemType: 'asset',
          assetType: data.assetType,
          currentValue: data.currentValue,
          purchasePrice: data.purchasePrice,
          purchaseDate: data.purchaseDate,
          lastUpdated: new Date().toISOString(),
          notes: data.notes
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          name: entry.title,
          assetType: data.assetType,
          currentValue: data.currentValue,
          purchasePrice: data.purchasePrice,
          purchaseDate: data.purchaseDate || '',
          lastUpdated: new Date().toISOString(),
          notes: data.notes,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating asset:', error)
      return null
    }
  }, [create])

  const updateAsset = useCallback(async (id: string, data: Partial<AssetFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.name,
        metadata: {
          assetType: data.assetType,
          currentValue: data.currentValue,
          purchasePrice: data.purchasePrice,
          purchaseDate: data.purchaseDate,
          lastUpdated: new Date().toISOString(),
          notes: data.notes
        }
      })
      return true
    } catch (error) {
      console.error('Error updating asset:', error)
      return false
    }
  }, [update])

  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting asset:', error)
      return false
    }
  }, [remove])

  // CRUD Functions - Investments
  const createInvestment = useCallback(async (data: InvestmentFormData): Promise<Investment | null> => {
    try {
      const totalCost = data.quantity * data.purchasePrice
      const totalValue = data.quantity * data.currentPrice
      const gainLoss = totalValue - totalCost
      const returnPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0

      const entry = await create({
        title: data.name,
        metadata: {
          itemType: 'investment',
          symbol: data.symbol,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          currentPrice: data.currentPrice,
          purchaseDate: data.purchaseDate,
          broker: data.broker,
          investmentType: data.investmentType,
          totalValue,
          totalCost,
          gainLoss,
          returnPercent
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          name: entry.title,
          symbol: data.symbol,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          currentPrice: data.currentPrice,
          purchaseDate: data.purchaseDate,
          broker: data.broker,
          investmentType: data.investmentType,
          totalValue,
          totalCost,
          gainLoss,
          returnPercent,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating investment:', error)
      return null
    }
  }, [create])

  const updateInvestment = useCallback(async (id: string, data: Partial<InvestmentFormData>): Promise<boolean> => {
    try {
      const totalCost = (data.quantity || 0) * (data.purchasePrice || 0)
      const totalValue = (data.quantity || 0) * (data.currentPrice || 0)
      const gainLoss = totalValue - totalCost
      const returnPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0

      await update(id, {
        title: data.name,
        metadata: {
          symbol: data.symbol,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          currentPrice: data.currentPrice,
          purchaseDate: data.purchaseDate,
          broker: data.broker,
          investmentType: data.investmentType,
          totalValue,
          totalCost,
          gainLoss,
          returnPercent
        }
      })
      return true
    } catch (error) {
      console.error('Error updating investment:', error)
      return false
    }
  }, [update])

  const deleteInvestment = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting investment:', error)
      return false
    }
  }, [remove])

  // CRUD Functions - Debts
  const createDebt = useCallback(async (data: DebtFormData): Promise<Debt | null> => {
    try {
      const entry = await create({
        title: data.name,
        metadata: {
          itemType: 'debt',
          creditor: data.creditor,
          loanType: data.loanType,
          interestRate: data.interestRate,
          originalBalance: data.originalBalance,
          currentBalance: data.currentBalance,
          minimumPayment: data.minimumPayment,
          dueDate: data.dueDate,
          accountNumber: data.accountNumber,
          termMonths: data.termMonths,
          isAutoPay: data.isAutoPay
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          name: entry.title,
          creditor: data.creditor,
          loanType: data.loanType,
          interestRate: data.interestRate,
          originalBalance: data.originalBalance,
          currentBalance: data.currentBalance,
          minimumPayment: data.minimumPayment,
          dueDate: data.dueDate,
          accountNumber: data.accountNumber,
          termMonths: data.termMonths,
          isAutoPay: data.isAutoPay,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating debt:', error)
      return null
    }
  }, [create])

  const updateDebt = useCallback(async (id: string, data: Partial<DebtFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.name,
        metadata: {
          creditor: data.creditor,
          loanType: data.loanType,
          interestRate: data.interestRate,
          originalBalance: data.originalBalance,
          currentBalance: data.currentBalance,
          minimumPayment: data.minimumPayment,
          dueDate: data.dueDate,
          accountNumber: data.accountNumber,
          termMonths: data.termMonths,
          isAutoPay: data.isAutoPay
        }
      })
      return true
    } catch (error) {
      console.error('Error updating debt:', error)
      return false
    }
  }, [update])

  const deleteDebt = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting debt:', error)
      return false
    }
  }, [remove])

  // CRUD Functions - Bills
  const createBill = useCallback(async (data: BillFormData): Promise<Bill | null> => {
    try {
      // Convert day-of-month to ISO date for the current month
      let fullDueDate = data.dueDate
      if (data.dueDate && !data.dueDate.includes('-')) {
        // If it's just a day number (e.g., "15" or "15th"), convert to ISO date
        const dayNum = parseInt(data.dueDate.replace(/\D/g, ''))
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          const today = new Date()
          const currentMonth = today.getMonth()
          const currentYear = today.getFullYear()
          let dueDate = new Date(currentYear, currentMonth, dayNum)
          
          // If the due date has already passed this month, use next month
          if (dueDate < today) {
            dueDate = new Date(currentYear, currentMonth + 1, dayNum)
          }
          
          fullDueDate = dueDate.toISOString().split('T')[0]
        }
      }
      
      const entry = await create({
        title: data.name,
        metadata: {
          itemType: 'bill',
          type: 'expense', // Mark as expense for categorization
          provider: data.provider,
          category: data.category,
          amount: data.amount,
          dueDate: fullDueDate,
          recurring: data.recurring,
          frequency: data.frequency,
          isAutoPay: data.isAutoPay,
          status: data.status || 'pending',
          account: data.account,
          notes: data.notes
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          name: entry.title,
          provider: data.provider,
          category: data.category,
          amount: data.amount,
          due_date: data.dueDate,
          dueDate: data.dueDate,
          recurring: data.recurring,
          frequency: data.frequency,
          is_autopay: data.isAutoPay,
          isAutoPay: data.isAutoPay,
          status: data.status || 'pending',
          account: data.account,
          notes: data.notes,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating bill:', error)
      return null
    }
  }, [create])

  const updateBill = useCallback(async (id: string, data: Partial<BillFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.name,
        metadata: {
          provider: data.provider,
          category: data.category,
          amount: data.amount,
          dueDate: data.dueDate,
          recurring: data.recurring,
          frequency: data.frequency,
          isAutoPay: data.isAutoPay,
          status: data.status,
          account: data.account,
          notes: data.notes
        }
      })
      return true
    } catch (error) {
      console.error('Error updating bill:', error)
      return false
    }
  }, [update])

  const deleteBill = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting bill:', error)
      return false
    }
  }, [remove])

  // CRUD Functions - Budget
  const createBudgetItem = useCallback(async (data: BudgetItemFormData): Promise<BudgetCategory | null> => {
    try {
      const entry = await create({
        title: data.category,
        metadata: {
          itemType: 'budget',
          category: data.category,
          budgetedAmount: data.budgetedAmount,
          spentAmount: 0,
          month: data.month,
          year: data.year,
          rollover: data.rollover
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          category: data.category,
          budgetedAmount: data.budgetedAmount,
          spentAmount: 0,
          month: data.month,
          year: data.year,
          variance: data.budgetedAmount,
          percentUsed: 0,
          rollover: data.rollover,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating budget item:', error)
      return null
    }
  }, [create])

  const updateBudgetItem = useCallback(async (id: string, data: Partial<BudgetItemFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.category,
        metadata: {
          category: data.category,
          budgetedAmount: data.budgetedAmount,
          month: data.month,
          year: data.year,
          rollover: data.rollover
        }
      })
      return true
    } catch (error) {
      console.error('Error updating budget item:', error)
      return false
    }
  }, [update])

  const deleteBudgetItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting budget item:', error)
      return false
    }
  }, [remove])

  // CRUD Functions - Goals
  const createGoal = useCallback(async (data: GoalFormData): Promise<FinancialGoal | null> => {
    try {
      const progress = data.targetAmount > 0 ? (data.currentAmount / data.targetAmount) * 100 : 0
      
      const entry = await create({
        title: data.title,
        description: data.description,
        metadata: {
          itemType: 'goal',
          goalType: data.goalType,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          targetDate: data.targetDate,
          monthlyContribution: data.monthlyContribution,
          priority: data.priority,
          status: 'active',
          progress
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          goalType: data.goalType,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          targetDate: data.targetDate,
          monthlyContribution: data.monthlyContribution,
          priority: data.priority,
          status: 'active',
          progress,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating goal:', error)
      return null
    }
  }, [create])

  const updateGoal = useCallback(async (id: string, data: Partial<GoalFormData>): Promise<boolean> => {
    try {
      const progress = (data.targetAmount && data.currentAmount) 
        ? (data.currentAmount / data.targetAmount) * 100 
        : undefined
      
      await update(id, {
        title: data.title,
        description: data.description,
        metadata: {
          goalType: data.goalType,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          targetDate: data.targetDate,
          monthlyContribution: data.monthlyContribution,
          priority: data.priority,
          progress
        }
      })
      return true
    } catch (error) {
      console.error('Error updating goal:', error)
      return false
    }
  }, [update])

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting goal:', error)
      return false
    }
  }, [remove])

  const updateGoalProgress = useCallback(async (id: string, amount: number): Promise<boolean> => {
    try {
      const goal = goals.find(g => g.id === id)
      if (!goal) return false
      
      const newCurrent = goal.currentAmount + amount
      const progress = goal.targetAmount > 0 ? (newCurrent / goal.targetAmount) * 100 : 0
      
      await update(id, {
        metadata: {
          currentAmount: newCurrent,
          progress
        }
      })
      return true
    } catch (error) {
      console.error('Error updating goal progress:', error)
      return false
    }
  }, [goals, update])

  // CRUD Functions - Recurring Transactions
  const createRecurringTransaction = useCallback(async (data: RecurringTransactionFormData): Promise<RecurringTransaction | null> => {
    try {
      const entry = await create({
        title: data.name,
        metadata: {
          itemType: 'recurring-transaction',
          type: data.type,
          category: data.category,
          amount: data.amount,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate,
          account: data.account,
          isActive: true
        }
      })
      
      if (entry) {
        return {
          id: entry.id,
          name: entry.title,
          type: data.type,
          category: data.category,
          amount: data.amount,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate,
          account: data.account,
          isActive: true,
          created_at: entry.createdAt || entry.created_at,
          updated_at: entry.updatedAt || entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('Error creating recurring transaction:', error)
      return null
    }
  }, [create])

  const updateRecurringTransaction = useCallback(async (id: string, data: Partial<RecurringTransactionFormData>): Promise<boolean> => {
    try {
      await update(id, {
        title: data.name,
        metadata: {
          type: data.type,
          category: data.category,
          amount: data.amount,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate,
          account: data.account
        }
      })
      return true
    } catch (error) {
      console.error('Error updating recurring transaction:', error)
      return false
    }
  }, [update])

  const deleteRecurringTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      await remove(id)
      return true
    } catch (error) {
      console.error('Error deleting recurring transaction:', error)
      return false
    }
  }, [remove])

  const generateRecurringTransactions = useCallback(async (): Promise<number> => {
    try {
      let count = 0
      const now = new Date()
      
      for (const recurring of recurringTransactions) {
        if (!recurring.isActive) continue
        
        // Create transaction from recurring template
        await createTransaction({
          title: recurring.name,
          type: recurring.type,
          category: recurring.category,
          amount: recurring.amount,
          date: now.toISOString().split('T')[0],
          account: recurring.account
        })
        
        count++
      }
      
      toast.success(`Generated ${count} transactions from recurring templates`)
      return count
    } catch (error) {
      console.error('Error generating recurring transactions:', error)
      toast.error('Failed to generate transactions')
      return 0
    }
  }, [recurringTransactions, createTransaction])

  // Utility functions
  const refreshData = useCallback(async () => {
    // Data refreshes automatically via useDomainCRUD
  }, [])

  const exportData = useCallback(async (options: ExportData): Promise<Blob | null> => {
    return null
  }, [])

  const calculateProjection = useCallback((
    years: number,
    monthlyContribution: number,
    annualReturn: number
  ): NetWorthProjection => {
    const currentNetWorth = financialSummary?.netWorth || 0
    const monthlyRate = annualReturn / 12 / 100
    
    const conservative: Array<{ year: number; value: number }> = []
    const expected: Array<{ year: number; value: number }> = []
    const optimistic: Array<{ year: number; value: number }> = []
    
    for (let year = 0; year <= years; year++) {
      const months = year * 12
      
      // Conservative (no returns)
      conservative.push({
        year,
        value: currentNetWorth + (monthlyContribution * months)
      })
      
      // Expected
      const fvExpected = currentNetWorth * Math.pow(1 + monthlyRate, months) +
        monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      expected.push({ year, value: fvExpected })
      
      // Optimistic (10% return)
      const optimisticRate = 0.10 / 12
      const fvOptimistic = currentNetWorth * Math.pow(1 + optimisticRate, months) +
        monthlyContribution * ((Math.pow(1 + optimisticRate, months) - 1) / optimisticRate)
      optimistic.push({ year, value: fvOptimistic })
    }
    
    return {
      years,
      monthlyContribution,
      annualReturn,
      currentNetWorth,
      projectedNetWorth: expected[expected.length - 1].value,
      totalGrowth: expected[expected.length - 1].value - currentNetWorth,
      scenarios: { conservative, expected, optimistic }
    }
  }, [financialSummary])

  const getTaxSummary = useCallback((year: number): TaxSummary => {
    return {
      year,
      totalIncome: 0,
      totalDeductions: 14600,
      standardDeduction: 14600,
      itemizedDeductions: 0,
      taxableIncome: 0,
      estimatedTax: 0,
      effectiveRate: 0,
      deductionsByCategory: {},
      taxSavingOpportunities: [
        {
          title: "Max out your 401(k) contribution",
          description: "$22500 remaining for 2025",
          type: 'suggestion'
        },
        {
          title: "IRA contribution limit",
          description: "$7000 for 2025",
          type: 'suggestion'
        },
        {
          title: "HSA triple tax advantage",
          description: "$4150 contribution limit",
          type: 'suggestion'
        },
        {
          title: "Consider charitable donations before year-end for deductions",
          description: "",
          type: 'reminder'
        },
        {
          title: "Tax-loss harvesting",
          description: "Review investment losses to offset gains",
          type: 'opportunity'
        }
      ]
    }
  }, [])

  const getSpendingTrend = useCallback((months: number): SpendingTrend[] => {
    return []
  }, [transactions])

  const getDailySpending = useCallback((month: string): DailySpending[] => {
    return []
  }, [transactions])

  const value: FinanceContextType = {
    // Data
    accounts,
    transactions,
    assets,
    investments,
    debts,
    bills,
    budgetCategories,
    goals,
    recurringTransactions,
    taxDeductions,
    
    // Calculated
    financialSummary,
    debtSummary,
    billSummary,
    investmentPortfolio,
    monthlyBudget,
    insights,
    
    // Loading
    loading,
    accountsLoading: loading,
    transactionsLoading: loading,
    assetsLoading: loading,
    debtsLoading: loading,
    billsLoading: loading,
    budgetLoading: loading,
    goalsLoading: loading,
    
    // CRUD
    createAccount,
    updateAccount,
    deleteAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAsset,
    updateAsset,
    deleteAsset,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    createDebt,
    updateDebt,
    deleteDebt,
    createBill,
    updateBill,
    deleteBill,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    generateRecurringTransactions,
    
    // Utilities
    refreshData,
    exportData,
    calculateProjection,
    getTaxSummary,
    getSpendingTrend,
    getDailySpending
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }
  return context
}

