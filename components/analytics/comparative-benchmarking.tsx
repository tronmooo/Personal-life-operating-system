'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, TrendingUp, TrendingDown, DollarSign, 
  Shield, Activity, Home, Target
} from 'lucide-react'

interface ComparativeBenchmarkingProps {
  userProfile: {
    age: number
    location: string
    incomeRange: string
  }
  userMetrics: {
    autoInsurance: number
    healthInsurance: number
    subscriptions: number
    savings: number
    fitnessActivity: number // activities per week
  }
}

// Simulated benchmark data (in production, this would come from aggregated anonymous user data)
const benchmarkData = {
  autoInsurance: {
    '20-30': { avg: 180, p25: 150, p75: 220 },
    '31-40': { avg: 160, p25: 140, p75: 190 },
    '41-50': { avg: 140, p25: 120, p75: 170 },
    '51-60': { avg: 130, p25: 110, p75: 160 },
    '60+': { avg: 120, p25: 100, p75: 150 },
  },
  healthInsurance: {
    'individual': { avg: 450, p25: 350, p75: 600 },
    'family': { avg: 1200, p25: 900, p75: 1600 },
  },
  subscriptions: {
    avg: 85, p25: 50, p75: 120
  },
  savingsRate: {
    avg: 15, p25: 10, p75: 20 // percentage of income
  },
  fitnessActivity: {
    avg: 3.5, p25: 2, p75: 5 // per week
  }
}

export function ComparativeBenchmarking({ userProfile, userMetrics }: ComparativeBenchmarkingProps) {
  const ageGroup = useMemo(() => {
    if (userProfile.age <= 30) return '20-30'
    if (userProfile.age <= 40) return '31-40'
    if (userProfile.age <= 50) return '41-50'
    if (userProfile.age <= 60) return '51-60'
    return '60+'
  }, [userProfile.age])

  const autoInsuranceComparison = useMemo(() => {
    const benchmark = benchmarkData.autoInsurance[ageGroup as keyof typeof benchmarkData.autoInsurance]
    const difference = userMetrics.autoInsurance - benchmark.avg
    const percentDiff = ((difference / benchmark.avg) * 100).toFixed(1)
    const status: 'above' | 'below' | 'average' = difference > 0 ? 'above' : difference < 0 ? 'below' : 'average'
    
    return {
      userValue: userMetrics.autoInsurance,
      avgValue: benchmark.avg,
      difference: Math.abs(difference),
      percentDiff: Math.abs(parseFloat(percentDiff)),
      status,
      message: difference > 0 
        ? `Your auto insurance is ${Math.abs(parseFloat(percentDiff))}% higher than average in your age group`
        : `Your auto insurance is ${Math.abs(parseFloat(percentDiff))}% lower than average in your age group`,
      potentialSavings: difference > 0 ? Math.round(difference * 12) : 0
    }
  }, [userMetrics.autoInsurance, ageGroup])

  const subscriptionsComparison = useMemo(() => {
    const benchmark = benchmarkData.subscriptions
    const difference = userMetrics.subscriptions - benchmark.avg
    const percentDiff = ((difference / benchmark.avg) * 100).toFixed(1)
    const status: 'above' | 'below' | 'average' = difference > 0 ? 'above' : difference < 0 ? 'below' : 'average'
    
    return {
      userValue: userMetrics.subscriptions,
      avgValue: benchmark.avg,
      difference: Math.abs(difference),
      percentDiff: Math.abs(parseFloat(percentDiff)),
      status,
      message: difference > 0
        ? `Users with similar profiles save $${Math.round(difference * 12)}/year on subscriptions`
        : `You're spending less than average on subscriptions`,
      annualSavings: difference > 0 ? Math.round(difference * 12) : 0
    }
  }, [userMetrics.subscriptions])

  const fitnessComparison = useMemo(() => {
    const benchmark = benchmarkData.fitnessActivity
    const difference = userMetrics.fitnessActivity - benchmark.avg
    const percentDiff = ((difference / benchmark.avg) * 100).toFixed(1)
    const status: 'above' | 'below' | 'average' = difference >= 0 ? 'above' : 'below'
    
    return {
      userValue: userMetrics.fitnessActivity,
      avgValue: benchmark.avg,
      difference: Math.abs(difference),
      percentDiff: Math.abs(parseFloat(percentDiff)),
      status,
      message: difference >= 0
        ? `You exercise ${Math.abs(parseFloat(percentDiff))}% more than average`
        : `Consider increasing activity to match average of ${benchmark.avg} workouts/week`
    }
  }, [userMetrics.fitnessActivity])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Comparative Benchmarking
        </CardTitle>
        <CardDescription>
          Compare your metrics with similar users (age: {userProfile.age}, {userProfile.location})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Insurance */}
        <BenchmarkCard
          icon={Shield}
          title="Auto Insurance"
          userValue={autoInsuranceComparison.userValue}
          avgValue={autoInsuranceComparison.avgValue}
          percentDiff={autoInsuranceComparison.percentDiff}
          status={autoInsuranceComparison.status}
          message={autoInsuranceComparison.message}
          unit="$/month"
          potentialSavings={autoInsuranceComparison.potentialSavings}
          color="purple"
        />

        {/* Subscriptions */}
        <BenchmarkCard
          icon={DollarSign}
          title="Digital Subscriptions"
          userValue={subscriptionsComparison.userValue}
          avgValue={subscriptionsComparison.avgValue}
          percentDiff={subscriptionsComparison.percentDiff}
          status={subscriptionsComparison.status}
          message={subscriptionsComparison.message}
          unit="$/month"
          potentialSavings={subscriptionsComparison.annualSavings}
          color="blue"
        />

        {/* Fitness Activity */}
        <BenchmarkCard
          icon={Activity}
          title="Fitness Activity"
          userValue={fitnessComparison.userValue}
          avgValue={fitnessComparison.avgValue}
          percentDiff={fitnessComparison.percentDiff}
          status={fitnessComparison.status}
          message={fitnessComparison.message}
          unit="workouts/week"
          color="green"
        />

        {/* Insights Summary */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Insights
          </h4>
          <ul className="space-y-2 text-sm">
            {autoInsuranceComparison.potentialSavings > 0 && (
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  You could save <strong>${autoInsuranceComparison.potentialSavings}/year</strong> by shopping for competitive auto insurance rates
                </span>
              </li>
            )}
            {subscriptionsComparison.annualSavings > 0 && (
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Potential to save <strong>${subscriptionsComparison.annualSavings}/year</strong> by reviewing and canceling unused subscriptions
                </span>
              </li>
            )}
            {fitnessComparison.status === 'above' && (
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Your fitness activity is <strong>above average</strong> - great job maintaining an active lifestyle!
                </span>
              </li>
            )}
            {fitnessComparison.status === 'below' && (
              <li className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>
                  {fitnessComparison.message}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground text-center p-3 bg-secondary rounded-lg">
          🔒 All comparisons use anonymized, aggregated data. Your personal information is never shared.
        </p>
      </CardContent>
    </Card>
  )
}

interface BenchmarkCardProps {
  icon: any
  title: string
  userValue: number
  avgValue: number
  percentDiff: number
  status: 'above' | 'below' | 'average'
  message: string
  unit: string
  potentialSavings?: number
  color: 'purple' | 'blue' | 'green' | 'red'
}

function BenchmarkCard({
  icon: Icon,
  title,
  userValue,
  avgValue,
  percentDiff,
  status,
  message,
  unit,
  potentialSavings,
  color
}: BenchmarkCardProps) {
  const colorClasses = {
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    green: 'text-green-600 bg-green-50 dark:bg-green-950',
    red: 'text-red-600 bg-red-50 dark:bg-red-950',
  }

  return (
    <div className="p-4 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-semibold">{title}</span>
        </div>
        <Badge 
          variant={status === 'above' ? 'destructive' : status === 'below' ? 'default' : 'secondary'}
        >
          {status === 'above' ? 'Above Average' : status === 'below' ? 'Below Average' : 'Average'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Your Value</p>
          <p className="text-2xl font-bold">{userValue.toFixed(1)} {unit}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="text-2xl font-bold text-muted-foreground">{avgValue.toFixed(1)} {unit}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Comparison</span>
          <span className={status === 'above' ? 'text-red-600' : 'text-green-600'}>
            {status === 'above' ? '+' : '-'}{percentDiff}%
          </span>
        </div>
        <Progress 
          value={status === 'above' ? 100 : (userValue / avgValue) * 100} 
          className="h-2"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {message}
      </p>

      {potentialSavings && potentialSavings > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Potential annual savings: ${potentialSavings}
          </span>
        </div>
      )}
    </div>
  )
}

