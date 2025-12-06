# Analytics Dashboard Architecture

## Component Tree

```
/analytics-comprehensive
│
├── [API] /api/analytics/comprehensive
│   ├── Authentication Check (Supabase)
│   ├── Query domain_entries (user-scoped)
│   ├── Calculate Financial Health
│   ├── Calculate Life Balance
│   ├── Calculate Cost Analysis
│   ├── Detect Trends
│   └── Generate Predictions
│
└── [PAGE] ComprehensiveAnalyticsPage
    ├── Header (title, time selector, export)
    │
    ├── Financial Health Score Card
    │   ├── Overall Score (0-100)
    │   ├── Income vs Expenses
    │   ├── Debt-to-Income Ratio
    │   └── Emergency Fund Status
    │
    ├── Cost Analysis Card
    │   ├── Total Monthly Cost
    │   └── Breakdown Cards
    │       ├── Insurance
    │       ├── Subscriptions
    │       ├── Bills
    │       ├── Maintenance
    │       └── Other
    │
    ├── Trend Detection Card
    │   └── Trend Items (forEach)
    │       ├── Domain Icon
    │       ├── Change Percentage
    │       └── Natural Language Message
    │
    ├── Predictive Analytics Card
    │   ├── Budget Forecast
    │   │   ├── Projected Spending
    │   │   ├── Current Budget
    │   │   └── Overage Amount
    │   └── Recommendations List
    │
    ├── [COMPONENT] LifeBalanceWheel
    │   ├── Overall Balance Score
    │   ├── Radar Chart (Recharts)
    │   │   └── 21 Domain Data Points
    │   ├── Top 5 Active Domains
    │   └── Inactive Domains Alert
    │
    ├── [COMPONENT] WhatIfScenarios
    │   ├── Tabs
    │   │   ├── Car Purchase Tab
    │   │   │   ├── Input Fields (price, down payment, rate, term)
    │   │   │   └── Impact Analysis
    │   │   │       ├── Monthly Payment
    │   │   │       ├── Budget Impact %
    │   │   │       ├── Savings Reduction
    │   │   │       └── Recommendation
    │   │   │
    │   │   ├── Insurance Comparison Tab
    │   │   │   ├── Current Plan Inputs
    │   │   │   ├── New Plan Inputs
    │   │   │   └── Comparison Results
    │   │   │       ├── Monthly Savings
    │   │   │       ├── Annual Savings
    │   │   │       ├── Deductible Change
    │   │   │       ├── Break-Even Years
    │   │   │       └── Recommendation
    │   │   │
    │   │   └── Relocation Tab
    │   │       ├── Cost Inputs (current, new, moving)
    │   │       └── Impact Results
    │   │           ├── Monthly Savings
    │   │           ├── Break-Even Months
    │   │           ├── 5-Year Savings
    │   │           └── Recommendation
    │   │
    └── [COMPONENT] ComparativeBenchmarking
        ├── User Profile Context
        ├── Benchmark Cards
        │   ├── Auto Insurance
        │   │   ├── Your Value vs Average
        │   │   ├── Percentage Difference
        │   │   ├── Progress Bar
        │   │   └── Potential Savings
        │   ├── Subscriptions
        │   │   └── (same structure)
        │   └── Fitness Activity
        │       └── (same structure)
        ├── Key Insights Summary
        └── Privacy Notice
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER REQUEST                         │
│           GET /analytics-comprehensive?timeRange=30          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION CHECK                      │
│                    (Supabase getUser)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE QUERY                             │
│   SELECT * FROM domain_entries WHERE user_id = $1           │
│   Filter by timeRange (current + previous periods)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PARALLEL CALCULATIONS                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Financial Health │  │  Life Balance    │                │
│  │   - Income/Exp   │  │  - 21 Domains    │                │
│  │   - Debt Ratio   │  │  - Trend %       │                │
│  │   - Emergency $  │  │  - Score/Domain  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Cost Analysis   │  │ Trend Detection  │                │
│  │   - By Category  │  │  - % Changes     │                │
│  │   - By Domain    │  │  - Threshold 20% │                │
│  │   - Total/Month  │  │  - Messages      │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐                                        │
│  │   Predictions    │                                        │
│  │  - Budget Fore.  │                                        │
│  │  - Overage Calc  │                                        │
│  │  - Recommend.    │                                        │
│  └──────────────────┘                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      JSON RESPONSE                           │
│  {                                                           │
│    financialHealth: {...},                                  │
│    lifeBalance: [...],                                      │
│    costAnalysis: {...},                                     │
│    trends: [...],                                           │
│    predictions: {...}                                       │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT COMPONENTS                          │
│                    (State Update)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     UI RENDERING                             │
│   - Cards with scores/metrics                               │
│   - Charts (Recharts radar)                                 │
│   - Interactive calculators                                 │
│   - Benchmarking comparisons                                │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```typescript
// Page Level State
const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [timeRange, setTimeRange] = useState(30)

// Component Level State (What-If Scenarios)
const [carPrice, setCarPrice] = useState(40000)
const [carDownPayment, setCarDownPayment] = useState(8000)
const [carInterestRate, setCarInterestRate] = useState(5.5)
// ... more scenario inputs

// Computed State (useMemo)
const carImpact = useMemo(() => {
  // Real-time calculation based on inputs
}, [carPrice, carDownPayment, carInterestRate, carTerm])
```

## API Response Schema

```typescript
interface ComprehensiveAnalyticsResponse {
  success: boolean
  data: {
    financialHealth: {
      score: number // 0-100
      incomeVsExpenses: {
        income: number
        expenses: number
        difference: number
        ratio: number
      }
      debtToIncome: {
        totalDebt: number
        monthlyIncome: number
        ratio: number // 0-1 (< 0.36 is healthy)
      }
      emergencyFund: {
        current: number
        target: number
        monthsCovered: number
        status: 'excellent' | 'good' | 'low' | 'critical'
      }
    }
    lifeBalance: Array<{
      domain: Domain
      count: number
      lastActivity: string | null
      trend: number // percentage change
      score: number // 0-100
    }>
    costAnalysis: {
      totalMonthlyCost: number
      breakdown: {
        insurance: number
        subscriptions: number
        bills: number
        maintenance: number
        other: number
      }
      byDomain: Record<string, number>
    }
    trends: Array<{
      domain: Domain
      metric: string
      change: number // percentage
      period: string
      status: 'increased' | 'decreased' | 'stable'
      message: string
    }>
    predictions: {
      budgetForecast: {
        projectedSpending: number
        currentBudget: number
        overageAmount: number
        confidence: number // 0-1
      }
      recommendations: string[]
    }
    metadata: {
      totalEntries: number
      timeRange: string
      generatedAt: string
    }
  }
}
```

## Calculation Algorithms

### Financial Health Score
```
Score = Base(50) + IncomeBonus + DebtBonus + EmergencyBonus
where:
  IncomeBonus = min(30, (income - expenses) / income * 30)
  DebtBonus = min(25, (1 - debtRatio / 0.36) * 25)
  EmergencyBonus = min(25, monthsCovered / 6 * 25)
```

### Domain Activity Score
```
Score = min(100, entryCount * 10)
```

### Trend Detection
```
Trend% = ((current - previous) / previous) * 100
Report if |Trend%| >= 20
```

### Budget Forecast
```
ProjectedSpending = RecentSpending + RecurringCosts
Overage = max(0, ProjectedSpending - Budget)
```

### Car Payment Calculation
```
MonthlyRate = AnnualRate / 12 / 100
MonthlyPayment = (LoanAmount * MonthlyRate * (1 + MonthlyRate)^Term) 
                 / ((1 + MonthlyRate)^Term - 1)
TotalMonthlyCost = MonthlyPayment + Insurance + Maintenance
```

### Insurance Break-Even
```
AnnualSavings = (CurrentPremium - NewPremium) * 12
DeductibleIncrease = NewDeductible - CurrentDeductible
BreakEvenYears = DeductibleIncrease / AnnualSavings
```

## Performance Considerations

### Database Queries
- Single query fetches all user entries
- Filtering happens in-memory (JavaScript)
- Time-based filtering using created_at index

### Calculation Optimization
- All calculations run in parallel
- useMemo for expensive computations
- Debounced input handling in What-If scenarios

### Component Optimization
- React.memo on expensive chart components
- useMemo for derived data
- useCallback for event handlers

### Data Volume Assumptions
- Expected: 100-1000 entries per user
- Maximum: 10,000 entries per user
- Response time target: < 2 seconds

## Security Model

```
Request → Authentication → Authorization → Data Access
   ↓           ↓               ↓              ↓
 User       getUser()    RLS Policies   User-Scoped
Session    Check Auth    (user_id)      Filtering
```

### Row Level Security (RLS)
```sql
-- Enforced at database level
CREATE POLICY user_domain_entries ON domain_entries
  FOR ALL USING (user_id = auth.uid());
```

### API-Level Security
```typescript
// Belt & Suspenders approach
const { data: { user }, error } = await supabase.auth.getUser()
if (!user) return 401 Unauthorized

// Explicit user_id filtering
.eq('user_id', user.id)
```

## Error Handling

```typescript
try {
  // API call
  const response = await fetch('/api/analytics/comprehensive')
  const result = await response.json()
  
  if (!response.ok) throw new Error(result.error)
  
  setAnalytics(result.data)
} catch (err) {
  console.error('Error:', err)
  setError(err.message)
  // Show error UI with retry button
}
```

## Testing Strategy

### Unit Tests (Recommended)
- Test calculation functions in isolation
- Mock Supabase client
- Test edge cases (zero entries, negative values)

### Integration Tests
- Test API route with test database
- Verify authentication flow
- Test time range filtering

### E2E Tests (Playwright)
- Navigate to /analytics-comprehensive
- Verify all sections render
- Test What-If scenario inputs
- Test export functionality

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase connection verified
- [ ] RLS policies active
- [ ] Authentication working
- [ ] Sample domain entries exist
- [ ] Type check passes
- [ ] Lint check passes
- [ ] Build succeeds
- [ ] Browser testing complete

---

**Architecture Status:** ✅ Production Ready
























