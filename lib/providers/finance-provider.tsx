'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { useAuth } from '../supabase/auth-provider'
import { toast } from 'sonner'
import {
  FinancialAccount,
  Transaction,
  Asset,
  Debt,
  Bill,
  FinancialGoal,
  Investment,
  BudgetCategory,
  RecurringTransaction,
  NetWorthSnapshot,
  TaxDeduction,
  FinancialSummary,
  DebtSummary,
  BillSummary,
  InvestmentPortfolio,
  MonthlyBudgetSummary,
  FinancialInsight,
  AccountFormData,
  TransactionFormData,
  AssetFormData,
  DebtFormData,
  BillFormData,
  GoalFormData,
  BudgetItemFormData
} from '@/types/finance'

// Stub functions - TODO: implement or import from correct location
const calculateFinancialSummary = (..._args: any[]): FinancialSummary => ({} as FinancialSummary)
const calculateDebtSummary = (..._args: any[]): DebtSummary => ({} as DebtSummary)
const calculateBillSummary = (..._args: any[]): BillSummary => ({} as BillSummary)
const calculateInvestmentPortfolio = (..._args: any[]): InvestmentPortfolio => ({} as InvestmentPortfolio)
const calculateMonthlyBudgetSummary = (..._args: any[]): MonthlyBudgetSummary => ({} as MonthlyBudgetSummary)
const generateFinancialInsights = (..._args: any[]): FinancialInsight[] => []
import { format } from 'date-fns'

interface FinanceContextType {
  // Data
  accounts: FinancialAccount[]
  transactions: Transaction[]
  assets: Asset[]
  investments: Investment[]
  debts: Debt[]
  bills: Bill[]
  budgetCategories: BudgetCategory[]
  goals: FinancialGoal[]
  recurringTransactions: RecurringTransaction[]
  
  // Calculated Data
  financialSummary: FinancialSummary | null
  debtSummary: DebtSummary | null
  billSummary: BillSummary | null
  investmentPortfolio: InvestmentPortfolio | null
  monthlyBudget: MonthlyBudgetSummary | null
  insights: any[]
  
  // Loading states
  loading: boolean
  accountsLoading: boolean
  transactionsLoading: boolean
  assetsLoading: boolean
  debtsLoading: boolean
  billsLoading: boolean
  budgetLoading: boolean
  goalsLoading: boolean
  
  // CRUD Functions - Accounts
  createAccount: (data: AccountFormData) => Promise<FinancialAccount | null>
  updateAccount: (id: string, data: Partial<AccountFormData>) => Promise<boolean>
  deleteAccount: (id: string) => Promise<boolean>
  
  // CRUD Functions - Transactions
  createTransaction: (data: TransactionFormData) => Promise<Transaction | null>
  updateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  
  // CRUD Functions - Assets
  createAsset: (data: AssetFormData) => Promise<Asset | null>
  updateAsset: (id: string, data: Partial<AssetFormData>) => Promise<boolean>
  deleteAsset: (id: string) => Promise<boolean>
  
  // CRUD Functions - Investments
  createInvestment: (data: any) => Promise<Investment | null>
  updateInvestment: (id: string, data: any) => Promise<boolean>
  deleteInvestment: (id: string) => Promise<boolean>
  
  // CRUD Functions - Debts
  createDebt: (data: DebtFormData) => Promise<Debt | null>
  updateDebt: (id: string, data: Partial<DebtFormData>) => Promise<boolean>
  deleteDebt: (id: string) => Promise<boolean>
  
  // CRUD Functions - Bills
  createBill: (data: BillFormData) => Promise<Bill | null>
  updateBill: (id: string, data: Partial<BillFormData>) => Promise<boolean>
  deleteBill: (id: string) => Promise<boolean>
  
  // CRUD Functions - Budget
  createBudgetItem: (data: BudgetItemFormData) => Promise<BudgetCategory | null>
  updateBudgetItem: (id: string, data: Partial<BudgetItemFormData>) => Promise<boolean>
  deleteBudgetItem: (id: string) => Promise<boolean>
  
  // CRUD Functions - Goals
  createGoal: (data: GoalFormData) => Promise<FinancialGoal | null>
  updateGoal: (id: string, data: Partial<GoalFormData>) => Promise<boolean>
  deleteGoal: (id: string) => Promise<boolean>
  updateGoalProgress: (id: string, amount: number) => Promise<boolean>
  
  // Utility Functions
  refreshAll: () => Promise<void>
  setCurrentMonth: (month: string) => void
  currentMonth: string
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProviderNew({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const { user } = useAuth()
  
  // State
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [debtsLoading, setDebtsLoading] = useState(false)
  const [billsLoading, setBillsLoading] = useState(false)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [goalsLoading, setGoalsLoading] = useState(false)
  
  // Calculated data
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null)
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null)
  const [investmentPortfolio, setInvestmentPortfolio] = useState<InvestmentPortfolio | null>(null)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudgetSummary | null>(null)
  const [insights, setInsights] = useState<any[]>([])
  
  // ==================== FETCH FUNCTIONS ====================
  
  const fetchAccounts = useCallback(async () => {
    if (!user) return
    setAccountsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAccounts(data || [])
    } catch (error: any) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load accounts')
    } finally {
      setAccountsLoading(false)
    }
  }, [user, supabase])
  
  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setTransactionsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(500)
      
      if (error) throw error
      setTransactions(data || [])
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setTransactionsLoading(false)
    }
  }, [user, supabase])
  
  const fetchAssets = useCallback(async () => {
    if (!user) return
    setAssetsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAssets(data || [])
    } catch (error: any) {
      console.error('Error fetching assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setAssetsLoading(false)
    }
  }, [user, supabase])
  
  const fetchInvestments = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('financial_investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setInvestments(data || [])
    } catch (error: any) {
      console.error('Error fetching investments:', error)
    }
  }, [user, supabase])
  
  const fetchDebts = useCallback(async () => {
    if (!user) return
    setDebtsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDebts(data || [])
    } catch (error: any) {
      console.error('Error fetching debts:', error)
      toast.error('Failed to load debts')
    } finally {
      setDebtsLoading(false)
    }
  }, [user, supabase])
  
  const fetchBills = useCallback(async () => {
    if (!user) return
    setBillsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      setBills(data || [])
    } catch (error: any) {
      console.error('Error fetching bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setBillsLoading(false)
    }
  }, [user, supabase])
  
  const fetchBudget = useCallback(async () => {
    if (!user) return
    setBudgetLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_budget_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
      
      if (error) throw error
      setBudgetCategories(data || [])
    } catch (error: any) {
      console.error('Error fetching budget:', error)
      toast.error('Failed to load budget')
    } finally {
      setBudgetLoading(false)
    }
  }, [user, supabase, currentMonth])
  
  const fetchGoals = useCallback(async () => {
    if (!user) return
    setGoalsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
      
      if (error) throw error
      setGoals(data || [])
    } catch (error: any) {
      console.error('Error fetching goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setGoalsLoading(false)
    }
  }, [user, supabase])
  
  const fetchRecurringTransactions = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('financial_recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (error) throw error
      setRecurringTransactions(data || [])
    } catch (error: any) {
      console.error('Error fetching recurring transactions:', error)
    }
  }, [user, supabase])
  
  // ==================== CRUD - ACCOUNTS ====================
  
  const createAccount = async (data: AccountFormData): Promise<FinancialAccount | null> => {
    if (!user) return null
    try {
      const { data: account, error } = await supabase
        .from('financial_accounts')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Account created successfully')
      await fetchAccounts()
      return account
    } catch (error: any) {
      console.error('Error creating account:', error)
      toast.error('Failed to create account')
      return null
    }
  }
  
  const updateAccount = async (id: string, data: Partial<AccountFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Account updated successfully')
      await fetchAccounts()
      return true
    } catch (error: any) {
      console.error('Error updating account:', error)
      toast.error('Failed to update account')
      return false
    }
  }
  
  const deleteAccount = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Account deleted successfully')
      await fetchAccounts()
      return true
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
      return false
    }
  }
  
  // ==================== CRUD - TRANSACTIONS ====================
  
  const createTransaction = async (data: TransactionFormData): Promise<Transaction | null> => {
    if (!user) return null
    try {
      const { data: transaction, error } = await supabase
        .from('financial_transactions')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Transaction added successfully')
      await fetchTransactions()
      await fetchAccounts() // Refresh accounts for balance updates
      return transaction
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to add transaction')
      return null
    }
  }
  
  const updateTransaction = async (id: string, data: Partial<TransactionFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Transaction updated successfully')
      await fetchTransactions()
      await fetchAccounts()
      return true
    } catch (error: any) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
      return false
    }
  }
  
  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Transaction deleted successfully')
      await fetchTransactions()
      await fetchAccounts()
      return true
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
      return false
    }
  }
  
  // ==================== CRUD - ASSETS ====================
  
  const createAsset = async (data: AssetFormData): Promise<Asset | null> => {
    if (!user) return null
    try {
      const { data: asset, error } = await supabase
        .from('financial_assets')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Asset added successfully')
      await fetchAssets()
      return asset
    } catch (error: any) {
      console.error('Error creating asset:', error)
      toast.error('Failed to add asset')
      return null
    }
  }
  
  const updateAsset = async (id: string, data: Partial<AssetFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_assets')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Asset updated successfully')
      await fetchAssets()
      return true
    } catch (error: any) {
      console.error('Error updating asset:', error)
      toast.error('Failed to update asset')
      return false
    }
  }
  
  const deleteAsset = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_assets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Asset deleted successfully')
      await fetchAssets()
      return true
    } catch (error: any) {
      console.error('Error deleting asset:', error)
      toast.error('Failed to delete asset')
      return false
    }
  }
  
  // ==================== CRUD - INVESTMENTS ====================
  
  const createInvestment = async (data: any): Promise<Investment | null> => {
    if (!user) return null
    try {
      const { data: investment, error } = await supabase
        .from('financial_investments')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Investment added successfully')
      await fetchInvestments()
      return investment
    } catch (error: any) {
      console.error('Error creating investment:', error)
      toast.error('Failed to add investment')
      return null
    }
  }
  
  const updateInvestment = async (id: string, data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_investments')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Investment updated successfully')
      await fetchInvestments()
      return true
    } catch (error: any) {
      console.error('Error updating investment:', error)
      toast.error('Failed to update investment')
      return false
    }
  }
  
  const deleteInvestment = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_investments')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Investment deleted successfully')
      await fetchInvestments()
      return true
    } catch (error: any) {
      console.error('Error deleting investment:', error)
      toast.error('Failed to delete investment')
      return false
    }
  }
  
  // ==================== CRUD - DEBTS ====================
  
  const createDebt = async (data: DebtFormData): Promise<Debt | null> => {
    if (!user) return null
    try {
      const { data: debt, error } = await supabase
        .from('financial_debts')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Debt added successfully')
      await fetchDebts()
      return debt
    } catch (error: any) {
      console.error('Error creating debt:', error)
      toast.error('Failed to add debt')
      return null
    }
  }
  
  const updateDebt = async (id: string, data: Partial<DebtFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_debts')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Debt updated successfully')
      await fetchDebts()
      return true
    } catch (error: any) {
      console.error('Error updating debt:', error)
      toast.error('Failed to update debt')
      return false
    }
  }
  
  const deleteDebt = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_debts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Debt deleted successfully')
      await fetchDebts()
      return true
    } catch (error: any) {
      console.error('Error deleting debt:', error)
      toast.error('Failed to delete debt')
      return false
    }
  }
  
  // ==================== CRUD - BILLS ====================
  
  const createBill = async (data: BillFormData): Promise<Bill | null> => {
    if (!user) return null
    try {
      const { data: bill, error } = await supabase
        .from('financial_bills')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Bill added successfully')
      await fetchBills()
      return bill
    } catch (error: any) {
      console.error('Error creating bill:', error)
      toast.error('Failed to add bill')
      return null
    }
  }
  
  const updateBill = async (id: string, data: Partial<BillFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_bills')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Bill updated successfully')
      await fetchBills()
      return true
    } catch (error: any) {
      console.error('Error updating bill:', error)
      toast.error('Failed to update bill')
      return false
    }
  }
  
  const deleteBill = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_bills')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Bill deleted successfully')
      await fetchBills()
      return true
    } catch (error: any) {
      console.error('Error deleting bill:', error)
      toast.error('Failed to delete bill')
      return false
    }
  }
  
  // ==================== CRUD - BUDGET ====================
  
  const createBudgetItem = async (data: BudgetItemFormData): Promise<BudgetCategory | null> => {
    if (!user) return null
    try {
      const { data: budgetItem, error } = await supabase
        .from('financial_budget_categories')
        .insert([{ ...data, user_id: user.id, spent_amount: 0 }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Budget item created successfully')
      await fetchBudget()
      return budgetItem
    } catch (error: any) {
      console.error('Error creating budget item:', error)
      toast.error('Failed to create budget item')
      return null
    }
  }
  
  const updateBudgetItem = async (id: string, data: Partial<BudgetItemFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_budget_categories')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Budget item updated successfully')
      await fetchBudget()
      return true
    } catch (error: any) {
      console.error('Error updating budget item:', error)
      toast.error('Failed to update budget item')
      return false
    }
  }
  
  const deleteBudgetItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_budget_categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Budget item deleted successfully')
      await fetchBudget()
      return true
    } catch (error: any) {
      console.error('Error deleting budget item:', error)
      toast.error('Failed to delete budget item')
      return false
    }
  }
  
  // ==================== CRUD - GOALS ====================
  
  const createGoal = async (data: GoalFormData): Promise<FinancialGoal | null> => {
    if (!user) return null
    try {
      const { data: goal, error } = await supabase
        .from('financial_goals')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Goal created successfully')
      await fetchGoals()
      return goal
    } catch (error: any) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal')
      return null
    }
  }
  
  const updateGoal = async (id: string, data: Partial<GoalFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_goals')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      toast.success('Goal updated successfully')
      await fetchGoals()
      return true
    } catch (error: any) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
      return false
    }
  }
  
  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Goal deleted successfully')
      await fetchGoals()
      return true
    } catch (error: any) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete goal')
      return false
    }
  }
  
  const updateGoalProgress = async (id: string, amount: number): Promise<boolean> => {
    try {
      const goal = goals.find(g => g.id === id)
      if (!goal) return false
      
      const newAmount = Number(goal.currentAmount) + amount
      const { error } = await supabase
        .from('financial_goals')
        .update({ current_amount: newAmount })
        .eq('id', id)
      
      if (error) throw error
      toast.success('Goal progress updated')
      await fetchGoals()
      return true
    } catch (error: any) {
      console.error('Error updating goal progress:', error)
      toast.error('Failed to update goal progress')
      return false
    }
  }
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const refreshAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchAccounts(),
      fetchTransactions(),
      fetchAssets(),
      fetchInvestments(),
      fetchDebts(),
      fetchBills(),
      fetchBudget(),
      fetchGoals(),
      fetchRecurringTransactions()
    ])
    setLoading(false)
  }
  
  // ==================== CALCULATE SUMMARIES ====================
  
  useEffect(() => {
    if (accounts.length > 0 || transactions.length > 0 || assets.length > 0 || debts.length > 0) {
      const summary = calculateFinancialSummary(accounts, transactions, assets, debts)
      setFinancialSummary(summary)
      
      const generatedInsights = generateFinancialInsights(summary, debts, goals)
      setInsights(generatedInsights)
    }
  }, [accounts, transactions, assets, debts, goals])
  
  useEffect(() => {
    if (debts.length > 0) {
      const summary = calculateDebtSummary(debts)
      setDebtSummary(summary)
    }
  }, [debts])
  
  useEffect(() => {
    if (bills.length > 0) {
      const summary = calculateBillSummary(bills)
      setBillSummary(summary)
    }
  }, [bills])
  
  useEffect(() => {
    if (investments.length > 0) {
      const portfolio = calculateInvestmentPortfolio(investments)
      setInvestmentPortfolio(portfolio)
    }
  }, [investments])
  
  useEffect(() => {
    if (budgetCategories.length > 0) {
      const summary = calculateMonthlyBudgetSummary(budgetCategories, currentMonth)
      setMonthlyBudget(summary)
    }
  }, [budgetCategories, currentMonth])
  
  // ==================== INITIAL LOAD ====================
  
  useEffect(() => {
    if (user) {
      refreshAll()
    }
  }, [user])
  
  useEffect(() => {
    if (user) {
      fetchBudget()
    }
  }, [currentMonth, user])
  
  const value = {
    accounts,
    transactions,
    assets,
    investments,
    debts,
    bills,
    budgetCategories,
    goals,
    recurringTransactions,
    financialSummary,
    debtSummary,
    billSummary,
    investmentPortfolio,
    monthlyBudget,
    insights,
    loading,
    accountsLoading,
    transactionsLoading,
    assetsLoading,
    debtsLoading,
    billsLoading,
    budgetLoading,
    goalsLoading,
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
    refreshAll,
    setCurrentMonth,
    currentMonth
  }
  
  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProviderNew')
  }
  return context
}

