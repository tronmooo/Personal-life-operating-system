'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Calculator } from 'lucide-react'

// Import existing calculator/converter tools
import { BMICalculator } from '@/components/tools/bmi-calculator'
import { BodyFatCalculator } from '@/components/tools/body-fat-calculator'
import { CalorieCalculator } from '@/components/tools/calorie-calculator'
import { MacroCalculator } from '@/components/tools/macro-calculator'
import { WaterIntakeCalculator } from '@/components/tools/water-intake-calculator'
import { HeartRateZones } from '@/components/tools/heart-rate-zones'
import { SleepCalculator } from '@/components/tools/sleep-calculator'
import { ProteinIntakeCalculator } from '@/components/tools/protein-intake-calculator'
import { MealPlanner } from '@/components/tools/meal-planner'
import { WorkoutPlanner } from '@/components/tools/workout-planner'
import { VO2MaxCalculator } from '@/components/tools/vo2max-calculator'
import { RunningPaceCalculator } from '@/components/tools/running-pace-calculator'
import { BodyAgeCalculator } from '@/components/tools/body-age-calculator'
import { IdealWeightCalculator } from '@/components/tools/ideal-weight-calculator'
import { PregnancyCalculator } from '@/components/tools/pregnancy-calculator'
import { MortgageCalculator } from '@/components/tools/mortgage-calculator'
import { LoanAmortizationCalculator } from '@/components/tools/loan-amortization-calculator'
import { CompoundInterestCalculator } from '@/components/tools/compound-interest-calculator'
import { RetirementCalculator } from '@/components/tools/retirement-calculator'
import { DebtPayoffCalculator } from '@/components/tools/debt-payoff-calculator'
import { SavingsGoalCalculator } from '@/components/tools/savings-goal-calculator'
import { EmergencyFundCalculator } from '@/components/tools/emergency-fund-calculator'
import { NetWorthCalculator } from '@/components/tools/net-worth-calculator'
import { BudgetOptimizerAI } from '@/components/tools/budget-optimizer-ai'
import { ROICalculator } from '@/components/tools/roi-calculator'
import { TaxEstimator } from '@/components/tools/tax-estimator'
import { BudgetPlanner } from '@/components/tools/budget-planner'
import { HomeAffordability } from '@/components/tools/home-affordability'
import { AutoLoanCalculator } from '@/components/tools/auto-loan-calculator'
import { TipCalculator } from '@/components/tools/tip-calculator'
import { UnitConverter } from '@/components/tools/unit-converter'
import { CurrencyConverter } from '@/components/tools/currency-converter'
import { TimeZoneConverter } from '@/components/tools/time-zone-converter'
import { PomodoroTimer } from '@/components/tools/pomodoro-timer'
import { InvestmentCalculator } from '@/components/tools/investment-calculator'
import { SalaryCalculator } from '@/components/tools/salary-calculator'
import { AgeCalculator } from '@/components/tools/age-calculator'
import { DateDifferenceCalculator } from '@/components/tools/date-difference-calculator'
import { PasswordGenerator } from '@/components/tools/password-generator'
import { QRCodeGenerator } from '@/components/tools/qr-code-generator'
import { ColorPicker } from '@/components/tools/color-picker'
import { MarkupCalculator } from '@/components/tools/markup-calculator'
import { HourlyRateCalculator } from '@/components/tools/hourly-rate-calculator'
import { ProjectCostEstimator } from '@/components/tools/project-cost-estimator'
import { PaycheckCalculator } from '@/components/tools/paycheck-calculator'
import { BreakEvenCalculator } from '@/components/tools/break-even-calculator'
import { PaintCalculator } from '@/components/tools/paint-calculator'
import { TileCalculator } from '@/components/tools/tile-calculator'
import { RoofingCalculator } from '@/components/tools/roofing-calculator'
import { EnergyCostCalculator } from '@/components/tools/energy-cost-calculator'
import { RenovationCostEstimator } from '@/components/tools/renovation-cost-estimator'

// Import AI-Powered Tools
// Tax & Financial
import { TaxPrepAssistant } from '@/components/tools/ai-tools/tax-prep-assistant'
import { ExpenseTrackerAI } from '@/components/tools/ai-tools/expense-tracker-ai'
import { ReceiptScannerPro } from '@/components/tools/ai-tools/receipt-scanner-pro'
import { InvoiceGenerator } from '@/components/tools/ai-tools/invoice-generator'
import { SmartBudgetCreator } from '@/components/tools/ai-tools/smart-budget-creator'
import { BillAutomation } from '@/components/tools/ai-tools/bill-automation'
import { FinancialReportGenerator } from '@/components/tools/ai-tools/financial-report-generator'
// Document Processing
import { DocumentScanner } from '@/components/tools/ai-tools/document-scanner'
import { SmartFormFiller } from '@/components/tools/ai-tools/smart-form-filler'
import { DocumentSummarizer } from '@/components/tools/ai-tools/document-summarizer'
import { DataEntryAI } from '@/components/tools/ai-tools/data-entry-ai'
import { ContractReviewer } from '@/components/tools/ai-tools/contract-reviewer'
import { DocumentOrganizer } from '@/components/tools/ai-tools/document-organizer'
// Scheduling & Planning
import { SmartScheduler } from '@/components/tools/ai-tools/smart-scheduler'
import { CalendarOptimizer } from '@/components/tools/ai-tools/calendar-optimizer'
import { TaskPrioritizer } from '@/components/tools/ai-tools/task-prioritizer'
// Communication
import { EmailAssistant } from '@/components/tools/ai-tools/email-assistant'
import { MeetingNotes } from '@/components/tools/ai-tools/meeting-notes'
import { TranslatorPro } from '@/components/tools/ai-tools/translator-pro'
import { ServiceComparator } from '@/components/tools/ai-tools/service-comparator'
import { EligibilityChecker } from '@/components/tools/ai-tools/eligibility-checker'
import { DeadlineTracker } from '@/components/tools/ai-tools/deadline-tracker'
import { ChatbotBuilder } from '@/components/tools/ai-tools/chatbot-builder'
import { ChecklistGenerator } from '@/components/tools/ai-tools/checklist-generator'
import { RenewalReminder } from '@/components/tools/ai-tools/renewal-reminder'
import { StatusTracker } from '@/components/tools/ai-tools/status-tracker'
// Research & Analysis
import { PriceTracker } from '@/components/tools/ai-tools/price-tracker'
// Administrative
import { TemplateGenerator } from '@/components/tools/ai-tools/template-generator'
// Planning
import { TravelPlannerAI } from '@/components/tools/ai-tools/travel-planner-ai'
import { MealPlannerAI } from '@/components/tools/ai-tools/meal-planner-ai'
// Analytics & Management
import { ExpenseAnalytics } from '@/components/tools/ai-tools/expense-analytics'
import { BillReminderSystem } from '@/components/tools/ai-tools/bill-reminder-system'
// Universal AI Tool (for remaining tools)
import { UniversalAITool } from '@/components/tools/ai-tools/universal-ai-tool'
// Generic
import { ComingSoonTool } from '@/components/tools/ai-tools/coming-soon-tool'
import { AI_TOOLS } from '@/lib/tools/ai-tools-config'

// Placeholder component for legacy tools
const LegacyComingSoon = ({ name }: { name: string }) => (
  <div className="p-8 text-center">
    <div className="mb-4 text-6xl">🚧</div>
    <h3 className="text-xl font-bold mb-2">{name}</h3>
    <p className="text-muted-foreground mb-4">This tool is coming soon!</p>
    <p className="text-sm text-muted-foreground">
      We're working hard to bring you this calculator. Check back soon!
    </p>
  </div>
)

const ALL_TOOLS = [
  // ==========================================
  // AI-POWERED WHITE-COLLAR TASK TOOLS
  // ==========================================
  
  // Tax & Financial AI Tools (7 tools)
  { id: 'tax-prep-ai', name: '✨ AI Tax Prep Assistant', category: 'AI Tools - Financial', icon: '🧾', component: TaxPrepAssistant, description: '🤖 Simple tax prep with W-2 scanning and AI data extraction' },
  { id: 'expense-tracker-ai', name: '✨ Smart Expense Tracker', category: 'AI Tools - Financial', icon: '💳', component: ExpenseTrackerAI, description: '🤖 Receipt scanning and auto-categorization with AI insights' },
  { id: 'receipt-scanner-pro', name: '✨ Receipt Scanner Pro', category: 'AI Tools - Financial', icon: '📸', component: ReceiptScannerPro, description: '🤖 Receipt scanning and data extraction' },
  { id: 'invoice-generator', name: '✨ AI Invoice Generator', category: 'AI Tools - Financial', icon: '📝', component: InvoiceGenerator, description: '🤖 Professional invoice generation with auto-fill' },
  { id: 'smart-budget-creator', name: '✨ Smart Budget Creator', category: 'AI Tools - Financial', icon: '💰', component: SmartBudgetCreator, description: '🤖 Budget creation and tracking with AI recommendations' },
  { id: 'bill-automation', name: '✨ Bill Pay Automation', category: 'AI Tools - Financial', icon: '🔔', component: BillAutomation, description: '🤖 Bill payment reminders and automation' },
  { id: 'financial-reports', name: '✨ Financial Report Generator', category: 'AI Tools - Financial', icon: '📊', component: FinancialReportGenerator, description: '🤖 Generate comprehensive financial reports' },
  { id: 'expense-analytics', name: '✨ Expense Analytics Dashboard', category: 'AI Tools - Financial', icon: '📊', component: ExpenseAnalytics, description: '🤖 AI-powered spending analysis and insights' },
  { id: 'bill-reminders', name: '✨ Bill Reminder System', category: 'AI Tools - Financial', icon: '🔔', component: BillReminderSystem, description: '🤖 Smart bill tracking and payment reminders' },
  // Note: All financial AI tools now implemented above
  
  // Document Processing AI Tools (6 tools)
  { id: 'document-scanner-ai', name: '✨ AI Document Scanner', category: 'AI Tools - Documents', icon: '📄', component: DocumentScanner, description: '🤖 Scan documents and extract data with AI OCR' },
  { id: 'smart-form-filler', name: '✨ Smart Form Filler', category: 'AI Tools - Documents', icon: '📋', component: SmartFormFiller, description: '🤖 Auto-fill applications and forms' },
  { id: 'document-summarizer', name: '✨ Document Summarizer AI', category: 'AI Tools - Documents', icon: '📚', component: DocumentSummarizer, description: '🤖 AI-powered document summarization' },
  { id: 'data-entry-ai', name: '✨ AI Data Entry Assistant', category: 'AI Tools - Documents', icon: '⌨️', component: DataEntryAI, description: '🤖 Automated data entry from images/PDFs' },
  { id: 'contract-reviewer', name: '✨ Contract Reviewer AI', category: 'AI Tools - Documents', icon: '⚖️', component: ContractReviewer, description: '🤖 Contract review and risk assessment' },
  { id: 'document-organizer', name: '✨ Smart Document Organizer', category: 'AI Tools - Documents', icon: '🗂️', component: DocumentOrganizer, description: '🤖 AI-powered document organization' },
  // Note: All document AI tools now implemented above
  
  // Scheduling & Planning AI Tools (5 tools)
  { id: 'smart-scheduler-ai', name: '✨ Smart Scheduler AI', category: 'AI Tools - Planning', icon: '📅', component: SmartScheduler, description: '🤖 AI appointment scheduling and calendar optimization' },
  { id: 'calendar-optimizer', name: '✨ Calendar Optimizer', category: 'AI Tools - Planning', icon: '🗓️', component: CalendarOptimizer, description: '🤖 Optimize your calendar with AI' },
  { id: 'task-prioritizer', name: '✨ Task Prioritizer AI', category: 'AI Tools - Planning', icon: '✅', component: TaskPrioritizer, description: '🤖 Intelligent task prioritization' },
  { id: 'travel-planner-ai', name: '✨ AI Travel Planner', category: 'AI Tools - Planning', icon: '✈️', component: TravelPlannerAI, description: '🤖 Travel planning and itinerary creation' },
  { id: 'meal-planner-ai', name: '✨ AI Meal Planner', category: 'AI Tools - Planning', icon: '🍽️', component: MealPlannerAI, description: '🤖 Weekly meal planning with grocery lists' },
  
  // Communication AI Tools (4 tools)
  { id: 'email-assistant', name: '✨ AI Email Assistant', category: 'AI Tools - Communication', icon: '📧', component: EmailAssistant, description: '🤖 Email drafting and smart responses' },
  { id: 'meeting-summarizer', name: '✨ Meeting Notes AI', category: 'AI Tools - Communication', icon: '📝', component: MeetingNotes, description: '🤖 Automatic meeting summaries and action items' },
  { id: 'translator-pro', name: '✨ AI Translator Pro', category: 'AI Tools - Communication', icon: '🌐', component: TranslatorPro, description: '🤖 Real-time translation for 100+ languages' },
  // Note: All communication AI tools now implemented above
  
  // Research & Analysis AI Tools (4 tools)
  { id: 'price-tracker', name: '✨ Price Tracker AI', category: 'AI Tools - Research', icon: '💲', component: PriceTracker, description: '🤖 Price comparison shopping with alerts' },
  { id: 'service-comparator', name: '✨ Service Comparator', category: 'AI Tools - Research', icon: '🔎', component: ServiceComparator, description: '🤖 Compare insurance, utilities, and service providers' },
  { id: 'eligibility-checker', name: '✨ Eligibility Checker', category: 'AI Tools - Research', icon: '✔️', component: EligibilityChecker, description: '🤖 Check eligibility for programs and benefits' },
  { id: 'deadline-tracker', name: '✨ Deadline Tracker Pro', category: 'AI Tools - Research', icon: '⏰', component: DeadlineTracker, description: '🤖 Track deadlines across multiple categories' },
  
  // Communication AI Tools (4 tools)
  { id: 'chatbot-builder', name: '✨ Customer Service Chatbot', category: 'AI Tools - Communication', icon: '🤖', component: ChatbotBuilder, description: '🤖 AI-powered customer service automation' },
  
  // Administrative AI Tools (4 tools)
  { id: 'template-generator', name: '✨ Document Template Generator', category: 'AI Tools - Admin', icon: '📄', component: TemplateGenerator, description: '🤖 Generate professional document templates' },
  { id: 'checklist-generator', name: '✨ Smart Checklist Generator', category: 'AI Tools - Admin', icon: '☑️', component: ChecklistGenerator, description: '🤖 Create checklists for complex processes' },
  { id: 'renewal-reminder', name: '✨ Renewal Reminder System', category: 'AI Tools - Admin', icon: '🔄', component: RenewalReminder, description: '🤖 Track and remind for renewals' },
  { id: 'status-tracker', name: '✨ Application Status Tracker', category: 'AI Tools - Admin', icon: '📊', component: StatusTracker, description: '🤖 Track status of applications and requests' },

  // ==========================================
  // ORIGINAL CALCULATOR TOOLS
  // ==========================================
  
  // Health & Fitness (15 tools)
  { id: 'bmi', name: 'BMI Calculator', category: 'Health', icon: '⚖️', component: BMICalculator, description: 'Calculate your Body Mass Index' },
  { id: 'body-fat', name: 'Body Fat Calculator', category: 'Health', icon: '📊', component: BodyFatCalculator, description: 'Estimate body fat percentage' },
  { id: 'calorie', name: 'Calorie Calculator', category: 'Health', icon: '🍎', component: CalorieCalculator, description: 'Calculate daily calorie needs' },
  { id: 'macro', name: 'Macro Calculator', category: 'Health', icon: '🥗', component: MacroCalculator, description: 'Calculate macronutrient targets' },
  { id: 'water', name: 'Water Intake Calculator', category: 'Health', icon: '💧', component: WaterIntakeCalculator, description: 'Daily water intake recommendations' },
  { id: 'heart-rate', name: 'Heart Rate Zones', category: 'Health', icon: '❤️', component: HeartRateZones, description: 'Calculate optimal heart rate zones' },
  { id: 'sleep', name: 'Sleep Calculator', category: 'Health', icon: '😴', component: SleepCalculator, description: 'Optimal sleep and wake times' },
  { id: 'protein', name: 'Protein Intake Calculator', category: 'Health', icon: '🥩', component: ProteinIntakeCalculator, description: 'Daily protein requirements' },
  { id: 'meal-plan', name: 'Meal Planner', category: 'Health', icon: '🍽️', component: MealPlanner, description: 'Plan your weekly meals' },
  { id: 'workout', name: 'Workout Planner', category: 'Health', icon: '💪', component: WorkoutPlanner, description: 'Create workout routines' },
  { id: 'vo2max', name: 'VO2 Max Calculator', category: 'Health', icon: '🏃', component: VO2MaxCalculator, description: 'Calculate aerobic capacity' },
  { id: 'pace', name: 'Running Pace Calculator', category: 'Health', icon: '⏱️', component: RunningPaceCalculator, description: 'Calculate running pace and splits' },
  { id: 'body-age', name: 'Body Age Calculator', category: 'Health', icon: '🎂', component: BodyAgeCalculator, description: 'Estimate your biological age' },
  { id: 'ideal-weight', name: 'Ideal Weight Calculator', category: 'Health', icon: '🎯', component: IdealWeightCalculator, description: 'Calculate your ideal weight' },
  { id: 'pregnancy', name: 'Pregnancy Calculator', category: 'Health', icon: '🤰', component: PregnancyCalculator, description: 'Due date and trimester calculator' },
  
  // Financial (15 tools) - ✨ AI-POWERED TOOLS HIGHLIGHTED
  { id: 'net-worth', name: '✨ Net Worth Calculator AI', category: 'Financial', icon: '💎', component: NetWorthCalculator, description: '🤖 Auto-fills from your data + AI advice to improve net worth' },
  { id: 'budget-ai', name: '✨ Budget Optimizer AI', category: 'Financial', icon: '🎯', component: BudgetOptimizerAI, description: '🤖 Smart budget planning with AI optimization suggestions' },
  { id: 'mortgage', name: 'Mortgage Calculator', category: 'Financial', icon: '🏠', component: MortgageCalculator, description: 'Calculate mortgage payments' },
  { id: 'loan', name: 'Loan Amortization', category: 'Financial', icon: '📈', component: LoanAmortizationCalculator, description: 'View loan payment schedule' },
  { id: 'compound', name: 'Compound Interest', category: 'Financial', icon: '💰', component: CompoundInterestCalculator, description: 'Calculate compound interest growth' },
  { id: 'retirement', name: 'Retirement Calculator', category: 'Financial', icon: '🏖️', component: RetirementCalculator, description: 'Plan for retirement' },
  { id: 'debt', name: 'Debt Payoff', category: 'Financial', icon: '💳', component: DebtPayoffCalculator, description: 'Create debt payoff plan' },
  { id: 'savings', name: 'Savings Goal', category: 'Financial', icon: '🎯', component: SavingsGoalCalculator, description: 'Calculate savings goals' },
  { id: 'emergency', name: 'Emergency Fund', category: 'Financial', icon: '🆘', component: EmergencyFundCalculator, description: 'Calculate emergency fund needs' },
  { id: 'roi', name: 'ROI Calculator', category: 'Financial', icon: '📊', component: ROICalculator, description: 'Return on investment calculator' },
  { id: 'tax', name: 'Tax Estimator', category: 'Financial', icon: '🧾', component: TaxEstimator, description: 'Estimate your taxes' },
  { id: 'budget', name: 'Budget Planner', category: 'Financial', icon: '📝', component: BudgetPlanner, description: 'Create a monthly budget' },
  { id: 'home-afford', name: 'Home Affordability', category: 'Financial', icon: '🏘️', component: HomeAffordability, description: 'How much house can you afford?' },
  { id: 'auto-loan', name: 'Auto Loan Calculator', category: 'Financial', icon: '🚗', component: AutoLoanCalculator, description: 'Calculate auto loan payments' },
  { id: 'investment', name: 'Investment Calculator', category: 'Financial', icon: '💹', component: InvestmentCalculator, description: 'Calculate investment returns' },
  { id: 'salary', name: 'Salary Calculator', category: 'Financial', icon: '💵', component: SalaryCalculator, description: 'Convert salary formats' },
  
  // Utility & Productivity (10 tools)
  { id: 'tip', name: 'Tip Calculator', category: 'Utility', icon: '💵', component: TipCalculator, description: 'Calculate tips and split bills' },
  { id: 'unit', name: 'Unit Converter', category: 'Utility', icon: '📏', component: UnitConverter, description: 'Convert between units' },
  { id: 'currency', name: 'Currency Converter', category: 'Utility', icon: '💱', component: CurrencyConverter, description: 'Convert currencies' },
  { id: 'timezone', name: 'Time Zone Converter', category: 'Utility', icon: '🌍', component: TimeZoneConverter, description: 'Convert between time zones' },
  { id: 'pomodoro', name: 'Pomodoro Timer', category: 'Utility', icon: '⏰', component: PomodoroTimer, description: 'Focus timer for productivity' },
  { id: 'age', name: 'Age Calculator', category: 'Utility', icon: '📅', component: AgeCalculator, description: 'Calculate exact age' },
  { id: 'date-diff', name: 'Date Difference', category: 'Utility', icon: '📆', component: DateDifferenceCalculator, description: 'Calculate days between dates' },
  { id: 'password', name: 'Password Generator', category: 'Utility', icon: '🔐', component: PasswordGenerator, description: 'Generate secure passwords' },
  { id: 'qr-code', name: 'QR Code Generator', category: 'Utility', icon: '📱', component: QRCodeGenerator, description: 'Create QR codes' },
  { id: 'color-picker', name: 'Color Picker', category: 'Utility', icon: '🎨', component: ColorPicker, description: 'Pick and convert colors' },
  
  // Business & Career (5 tools)
  { id: 'markup', name: 'Markup Calculator', category: 'Business', icon: '💼', component: MarkupCalculator, description: 'Calculate markup and margin' },
  { id: 'hourly-rate', name: 'Hourly Rate Calculator', category: 'Business', icon: '⏳', component: HourlyRateCalculator, description: 'Calculate hourly billing rate' },
  { id: 'project-cost', name: 'Project Cost Estimator', category: 'Business', icon: '📊', component: ProjectCostEstimator, description: 'Estimate project costs' },
  { id: 'paycheck', name: 'Paycheck Calculator', category: 'Business', icon: '💰', component: PaycheckCalculator, description: 'Calculate take-home pay' },
  { id: 'break-even', name: 'Break-Even Analysis', category: 'Business', icon: '📈', component: BreakEvenCalculator, description: 'Calculate break-even point' },

  // Home & Property (5 tools)
  { id: 'paint', name: 'Paint Calculator', category: 'Home', icon: '🎨', component: PaintCalculator, description: 'Calculate paint needed' },
  { id: 'tile', name: 'Tile Calculator', category: 'Home', icon: '🔲', component: TileCalculator, description: 'Calculate tiles needed' },
  { id: 'roofing', name: 'Roofing Calculator', category: 'Home', icon: '🏠', component: RoofingCalculator, description: 'Estimate roofing materials' },
  { id: 'energy', name: 'Energy Cost Calculator', category: 'Home', icon: '⚡', component: EnergyCostCalculator, description: 'Calculate energy costs' },
  { id: 'renovation', name: 'Renovation Cost Estimator', category: 'Home', icon: '🔨', component: RenovationCostEstimator, description: 'Estimate renovation costs' },
]

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(ALL_TOOLS.map(tool => tool.category)))

  const filteredTools = ALL_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const SelectedComponent = selectedTool ? ALL_TOOLS.find(t => t.id === selectedTool)?.component : null

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-purple-500" />
            AI-Powered Tools & Calculators
          </h1>
          <p className="text-lg text-muted-foreground">
            {ALL_TOOLS.length} powerful tools including {AI_TOOLS.length} AI-powered white-collar task automation tools plus calculators and converters
          </p>
          <div className="mt-2 flex gap-2">
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
              ✨ 29 NEW AI Tools
            </Badge>
            <Badge variant="outline">
              🤖 Auto-Fill from Your Data
            </Badge>
            <Badge variant="outline">
              💡 Smart Suggestions
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={!selectedCategory ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All ({ALL_TOOLS.length})
          </Badge>
          {categories.map(category => {
            const count = ALL_TOOLS.filter(t => t.category === category).length
            return (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </Badge>
            )
          })}
        </div>

        {/* Selected Tool Display */}
        {SelectedComponent && (
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">
                    {ALL_TOOLS.find(t => t.id === selectedTool)?.icon}
                  </span>
                  {ALL_TOOLS.find(t => t.id === selectedTool)?.name}
                </CardTitle>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-accent"
                >
                  Close
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <SelectedComponent />
            </CardContent>
          </Card>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map(tool => (
            <Card
              key={tool.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300"
              onClick={() => setSelectedTool(tool.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl">{tool.icon}</div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {tool.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {tool.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No tools found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or category filter
            </p>
          </div>
        )}

        {/* Stats */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600">{ALL_TOOLS.length}</div>
                <div className="text-sm text-muted-foreground">Total Tools</div>
              </div>
              {categories.map(category => (
                <div key={category}>
                  <div className="text-3xl font-bold text-purple-600">
                    {ALL_TOOLS.filter(t => t.category === category).length}
                  </div>
                  <div className="text-sm text-muted-foreground">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
