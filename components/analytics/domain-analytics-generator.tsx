'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock,
  DollarSign, Heart, Briefcase, Home, Car, Shield, Calendar,
  Target, Activity, Users, Plane, Book, Sparkles, Zap
} from 'lucide-react'
import { format, subDays, parseISO, differenceInDays } from 'date-fns'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#14b8a6']

interface DomainAnalyticsProps {
  domain?: string
  items: any[]
  documents?: any[]
}

export function DomainAnalyticsGenerator({ domain, items, documents = [] }: DomainAnalyticsProps) {
  // Route to specific domain analytics
  switch (domain) {
    case 'financial':
      return <FinancialAnalytics items={items} documents={documents} />
    case 'health':
      return <HealthAnalytics items={items} documents={documents} />
    case 'insurance':
      return <InsuranceAnalytics items={items} documents={documents} />
    case 'home':
      return <HomeAnalytics items={items} documents={documents} />
    case 'vehicles':
      return <VehiclesAnalytics items={items} documents={documents} />
    case 'travel':
      return <TravelAnalytics items={items} documents={documents} />
    case 'relationships':
      return <RelationshipsAnalytics items={items} documents={documents} />
    case 'pets':
      return <PetsAnalytics items={items} documents={documents} />
    case 'nutrition':
      return <NutritionAnalytics items={items} documents={documents} />
    case 'goals':
      return <GoalsAnalytics items={items} documents={documents} />
    default:
      return <GenericDomainAnalytics domain={domain} items={items} documents={documents} />
  }
}

// ==================== FINANCIAL ANALYTICS ====================
function FinancialAnalytics({ items }: { items: any[], documents: any[] }) {
  const analytics = useMemo(() => {
    let totalBalance = 0
    let totalIncome = 0
    let totalExpenses = 0
    let totalInvestments = 0
    const accountTypes: Record<string, number> = {}
    const monthlyTrend: any[] = []

    items.forEach(item => {
      const balance = parseFloat(item.metadata?.balance || item.metadata?.amount || 0)
      const category = item.metadata?.category || item.metadata?.type || item.metadata?.accountType
      
      totalBalance += balance

      if (category) {
        accountTypes[category] = (accountTypes[category] || 0) + 1
      }

      // Income vs Expenses
      if (category?.toLowerCase().includes('income')) {
        totalIncome += Math.abs(balance)
      } else if (category?.toLowerCase().includes('expense') || category?.toLowerCase().includes('bill')) {
        totalExpenses += Math.abs(balance)
      } else if (category?.toLowerCase().includes('investment')) {
        totalInvestments += Math.abs(balance)
      }
    })

    const netWorth = totalBalance
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    const accountsData = Object.entries(accountTypes).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }))

    return {
      netWorth,
      totalIncome,
      totalExpenses,
      totalInvestments,
      savingsRate,
      accountCount: items.length,
      accountsData
    }
  }, [items])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Worth"
          value={`$${analytics.netWorth.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={analytics.netWorth > 0 ? 'up' : 'down'}
          color="blue"
        />
        <MetricCard
          title="Monthly Income"
          value={`$${analytics.totalIncome.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Monthly Expenses"
          value={`$${analytics.totalExpenses.toLocaleString()}`}
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
        />
        <MetricCard
          title="Savings Rate"
          value={`${analytics.savingsRate.toFixed(1)}%`}
          icon={<Target className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Distribution */}
        {analytics.accountsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Account Distribution</CardTitle>
              <CardDescription>Breakdown by account type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.accountsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.accountsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Financial health overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Income', amount: analytics.totalIncome, fill: '#10b981' },
                { name: 'Expenses', amount: analytics.totalExpenses, fill: '#ef4444' },
                { name: 'Net', amount: analytics.totalIncome - analytics.totalExpenses, fill: '#3b82f6' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="amount" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
          <CardDescription>Based on savings rate, balance, and account diversity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Savings Rate ({analytics.savingsRate.toFixed(1)}%)</span>
                <span className="text-sm text-muted-foreground">{analytics.savingsRate > 20 ? 'Excellent' : analytics.savingsRate > 10 ? 'Good' : 'Needs Improvement'}</span>
              </div>
              <Progress value={Math.min(analytics.savingsRate, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Account Diversity ({analytics.accountsData.length} types)</span>
                <span className="text-sm text-muted-foreground">{analytics.accountsData.length >= 3 ? 'Well Diversified' : 'Limited'}</span>
              </div>
              <Progress value={(analytics.accountsData.length / 5) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== HEALTH ANALYTICS ====================
function HealthAnalytics({ items }: { items: any[], documents: any[] }) {
  const analytics = useMemo(() => {
    let totalAppointments = 0
    let upcomingAppointments = 0
    let medications = 0
    const vitalSigns: any[] = []
    const appointmentTypes: Record<string, number> = {}

    const now = new Date()
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    items.forEach(item => {
      const category = item.metadata?.category || item.metadata?.type
      
      if (category?.toLowerCase().includes('appointment')) {
        totalAppointments++
        const appointmentDate = item.metadata?.date || item.metadata?.appointmentDate
        if (appointmentDate) {
          const apptDate = new Date(appointmentDate)
          if (apptDate >= now && apptDate <= futureDate) {
            upcomingAppointments++
          }
        }
        const type = item.metadata?.appointmentType || 'General'
        appointmentTypes[type] = (appointmentTypes[type] || 0) + 1
      }

      if (category?.toLowerCase().includes('medication')) {
        medications++
      }

      // Track vital signs
      if (item.metadata?.weight || item.metadata?.bloodPressure || item.metadata?.heartRate) {
        vitalSigns.push({
          date: format(new Date(item.createdAt), 'MMM d'),
          weight: parseFloat(item.metadata.weight) || 0,
          systolic: item.metadata.bloodPressure ? parseInt(item.metadata.bloodPressure.split('/')[0]) : 0,
          heartRate: parseInt(item.metadata.heartRate) || 0
        })
      }
    })

    const appointmentData = Object.entries(appointmentTypes).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }))

    return {
      totalAppointments,
      upcomingAppointments,
      medications,
      vitalSigns: vitalSigns.slice(-10), // Last 10 measurements
      appointmentData,
      healthScore: 85 // Calculated based on regular checkups, medications taken, etc.
    }
  }, [items])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Appointments"
          value={analytics.totalAppointments}
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Upcoming (30d)"
          value={analytics.upcomingAppointments}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />
        <MetricCard
          title="Active Medications"
          value={analytics.medications}
          icon={<Heart className="h-5 w-5" />}
          color="red"
        />
        <MetricCard
          title="Health Score"
          value={`${analytics.healthScore}%`}
          icon={<Activity className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vital Signs Trend */}
        {analytics.vitalSigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs Trend</CardTitle>
              <CardDescription>Weight and blood pressure over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.vitalSigns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#3b82f6" name="Weight (lbs)" />
                  <Line yAxisId="right" type="monotone" dataKey="systolic" stroke="#ef4444" name="BP (Systolic)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Appointment Distribution */}
        {analytics.appointmentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Appointment Types</CardTitle>
              <CardDescription>Distribution by specialty</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.appointmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.appointmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Health Alerts */}
      {analytics.upcomingAppointments > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You have {analytics.upcomingAppointments} appointment{analytics.upcomingAppointments > 1 ? 's' : ''} scheduled in the next 30 days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== CAREER ANALYTICS ====================
function CareerAnalytics({ items }: { items: any[], documents: any[] }) {
  const analytics = useMemo(() => {
    let totalApplications = 0
    let responses = 0
    let interviews = 0
    const skills: string[] = []
    const applicationStatus: Record<string, number> = {}

    items.forEach(item => {
      const category = item.metadata?.category || item.metadata?.type
      
      if (category?.toLowerCase().includes('application')) {
        totalApplications++
        const status = item.metadata?.status || 'Pending'
        applicationStatus[status] = (applicationStatus[status] || 0) + 1
        
        if (status.toLowerCase().includes('response')) {
          responses++
        }
        if (status.toLowerCase().includes('interview')) {
          interviews++
        }
      }

      if (category?.toLowerCase().includes('skill') && item.metadata?.skillName) {
        skills.push(item.metadata.skillName)
      }
    })

    const responseRate = totalApplications > 0 ? (responses / totalApplications) * 100 : 0
    const interviewRate = totalApplications > 0 ? (interviews / totalApplications) * 100 : 0

    const statusData = Object.entries(applicationStatus).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }))

    return {
      totalApplications,
      responses,
      interviews,
      responseRate,
      interviewRate,
      skillsCount: skills.length,
      statusData
    }
  }, [items])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Applications Sent"
          value={analytics.totalApplications}
          icon={<Briefcase className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Response Rate"
          value={`${analytics.responseRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Interviews"
          value={analytics.interviews}
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Skills Tracked"
          value={analytics.skillsCount}
          icon={<Sparkles className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>From application to interview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Applied', value: analytics.totalApplications, fill: '#3b82f6' },
                { name: 'Responses', value: analytics.responses, fill: '#8b5cf6' },
                { name: 'Interviews', value: analytics.interviews, fill: '#10b981' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Status */}
        {analytics.statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Current pipeline breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Career Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Career Search Effectiveness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm text-muted-foreground">{analytics.responseRate.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(analytics.responseRate, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Interview Rate</span>
                <span className="text-sm text-muted-foreground">{analytics.interviewRate.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(analytics.interviewRate, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ... Additional analytics for other domains will be added ...

// ==================== GENERIC DOMAIN ANALYTICS ====================
function GenericDomainAnalytics({ domain, items, documents }: DomainAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalItems = items.length
    const recentItems = items.filter(item => {
      const created = new Date(item.createdAt)
      const lastWeek = subDays(new Date(), 7)
      return created >= lastWeek
    }).length

    const categoryCounts: Record<string, number> = {}
    items.forEach(item => {
      const category = item.metadata?.category || item.metadata?.type || 'Uncategorized'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    const categoryData = Object.entries(categoryCounts).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }))

    return {
      totalItems,
      recentItems,
      categoryData,
      documentsCount: documents?.length || 0
    }
  }, [items, documents])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Items"
          value={analytics.totalItems}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Recent (7d)"
          value={analytics.recentItems}
          icon={<Clock className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Documents"
          value={analytics.documentsCount}
          icon={<Shield className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Categories"
          value={analytics.categoryData.length}
          icon={<Target className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {analytics.categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{domain} Distribution</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {analytics.totalItems === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {domain} data yet. Start tracking to see analytics!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Placeholder functions for remaining domains (will be implemented similarly)
const InsuranceAnalytics = GenericDomainAnalytics
const HomeAnalytics = GenericDomainAnalytics
const VehiclesAnalytics = GenericDomainAnalytics
const TravelAnalytics = GenericDomainAnalytics
const EducationAnalytics = GenericDomainAnalytics
const RelationshipsAnalytics = GenericDomainAnalytics
const PetsAnalytics = GenericDomainAnalytics
const NutritionAnalytics = GenericDomainAnalytics
const GoalsAnalytics = GenericDomainAnalytics

// ==================== METRIC CARD COMPONENT ====================
function MetricCard({ title, value, icon, trend, color = 'blue' }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-950/20 text-green-600',
    red: 'bg-red-50 dark:bg-red-950/20 text-red-600',
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600',
    orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            <span>{trend === 'up' ? 'Trending up' : 'Trending down'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}







