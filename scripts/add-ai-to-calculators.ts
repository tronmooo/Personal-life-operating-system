/**
 * Script to add AI insights to all calculators
 * Run with: npx ts-node scripts/add-ai-to-calculators.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const CALCULATORS_DIR = path.join(__dirname, '../components/tools')

// List of all calculator files (excluding ai-tools directory)
const CALCULATOR_FILES = [
  'age-calculator.tsx',
  'auto-loan-calculator.tsx',
  'body-age-calculator.tsx',
  'body-fat-calculator.tsx',
  'break-even-calculator.tsx',
  'budget-optimizer-ai.tsx',
  'budget-planner.tsx',
  'calorie-calculator.tsx',
  'color-picker.tsx',
  'compound-interest-calculator.tsx',
  'currency-converter.tsx',
  'date-difference-calculator.tsx',
  'debt-payoff-calculator.tsx',
  'emergency-fund-calculator.tsx',
  'energy-cost-calculator.tsx',
  'heart-rate-zones.tsx',
  'home-affordability.tsx',
  'hourly-rate-calculator.tsx',
  'ideal-weight-calculator.tsx',
  'investment-calculator.tsx',
  'loan-amortization-calculator.tsx',
  'macro-calculator.tsx',
  'markup-calculator.tsx',
  'meal-planner.tsx',
  'mortgage-calculator.tsx',
  'net-worth-calculator.tsx',
  'paint-calculator.tsx',
  'password-generator.tsx',
  'paycheck-calculator.tsx',
  'pomodoro-timer.tsx',
  'pregnancy-calculator.tsx',
  'project-cost-estimator.tsx',
  'protein-intake-calculator.tsx',
  'qr-code-generator.tsx',
  'renovation-cost-estimator.tsx',
  'retirement-calculator.tsx',
  'roi-calculator.tsx',
  'roofing-calculator.tsx',
  'running-pace-calculator.tsx',
  'salary-calculator.tsx',
  'savings-goal-calculator.tsx',
  'sleep-calculator.tsx',
  'tax-estimator.tsx',
  'tile-calculator.tsx',
  'time-zone-converter.tsx',
  'tip-calculator.tsx',
  'unit-converter.tsx',
  'vo2max-calculator.tsx',
  'water-intake-calculator.tsx',
  'workout-planner.tsx'
]

// Files that don't need AI (utilities, generators, timers)
const SKIP_FILES = [
  'password-generator.tsx',
  'qr-code-generator.tsx',
  'pomodoro-timer.tsx',
  'color-picker.tsx',
  'unit-converter.tsx',
  'currency-converter.tsx',
  'time-zone-converter.tsx',
  'date-difference-calculator.tsx',
  'age-calculator.tsx'
]

interface CalculatorMapping {
  file: string
  type: string
  category: string
}

const CALCULATOR_TYPES: CalculatorMapping[] = [
  // Health & Fitness
  { file: 'bmi-calculator.tsx', type: 'bmi', category: 'health' },
  { file: 'body-fat-calculator.tsx', type: 'health', category: 'health' },
  { file: 'body-age-calculator.tsx', type: 'health', category: 'health' },
  { file: 'calorie-calculator.tsx', type: 'calorie', category: 'health' },
  { file: 'macro-calculator.tsx', type: 'fitness', category: 'health' },
  { file: 'water-intake-calculator.tsx', type: 'health', category: 'health' },
  { file: 'heart-rate-zones.tsx', type: 'fitness', category: 'health' },
  { file: 'sleep-calculator.tsx', type: 'health', category: 'health' },
  { file: 'protein-intake-calculator.tsx', type: 'fitness', category: 'health' },
  { file: 'meal-planner.tsx', type: 'calorie', category: 'health' },
  { file: 'workout-planner.tsx', type: 'fitness', category: 'health' },
  { file: 'vo2max-calculator.tsx', type: 'fitness', category: 'health' },
  { file: 'running-pace-calculator.tsx', type: 'fitness', category: 'health' },
  { file: 'ideal-weight-calculator.tsx', type: 'health', category: 'health' },
  { file: 'pregnancy-calculator.tsx', type: 'health', category: 'health' },

  // Financial
  { file: 'net-worth-calculator.tsx', type: 'investment', category: 'financial' },
  { file: 'budget-optimizer-ai.tsx', type: 'budget', category: 'financial' },
  { file: 'mortgage-calculator.tsx', type: 'mortgage', category: 'financial' },
  { file: 'loan-amortization-calculator.tsx', type: 'loan', category: 'financial' },
  { file: 'compound-interest-calculator.tsx', type: 'compound', category: 'financial' },
  { file: 'retirement-calculator.tsx', type: 'retirement', category: 'financial' },
  { file: 'debt-payoff-calculator.tsx', type: 'debt', category: 'financial' },
  { file: 'savings-goal-calculator.tsx', type: 'savings', category: 'financial' },
  { file: 'emergency-fund-calculator.tsx', type: 'savings', category: 'financial' },
  { file: 'roi-calculator.tsx', type: 'investment', category: 'financial' },
  { file: 'tax-estimator.tsx', type: 'tax', category: 'financial' },
  { file: 'budget-planner.tsx', type: 'budget', category: 'financial' },
  { file: 'home-affordability.tsx', type: 'mortgage', category: 'financial' },
  { file: 'auto-loan-calculator.tsx', type: 'loan', category: 'financial' },
  { file: 'investment-calculator.tsx', type: 'investment', category: 'financial' },
  { file: 'salary-calculator.tsx', type: 'tax', category: 'financial' },

  // Business & Career
  { file: 'markup-calculator.tsx', type: 'investment', category: 'business' },
  { file: 'hourly-rate-calculator.tsx', type: 'business', category: 'business' },
  { file: 'project-cost-estimator.tsx', type: 'business', category: 'business' },
  { file: 'paycheck-calculator.tsx', type: 'tax', category: 'business' },
  { file: 'break-even-calculator.tsx', type: 'business', category: 'business' },

  // Home & Property
  { file: 'paint-calculator.tsx', type: 'property', category: 'property' },
  { file: 'tile-calculator.tsx', type: 'property', category: 'property' },
  { file: 'roofing-calculator.tsx', type: 'property', category: 'property' },
  { file: 'energy-cost-calculator.tsx', type: 'property', category: 'property' },
  { file: 'renovation-cost-estimator.tsx', type: 'property', category: 'property' }
]

function enhanceCalculator(filePath: string, mapping: CalculatorMapping): void {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Check if already enhanced
  if (content.includes('useCalculatorAI') || content.includes('CalculatorAIInsightsComponent')) {
    console.log(`⏭️  Skipping ${mapping.file} - already enhanced`)
    return
  }

  console.log(`🔧 Enhancing ${mapping.file}...`)

  // Step 1: Add imports
  const importSection = content.match(/(import.*\n)+/)
  if (importSection) {
    const lastImport = importSection[0]
    const newImports = `${lastImport}import { Sparkles } from 'lucide-react'\nimport { useCalculatorAI } from '@/lib/hooks/use-calculator-ai'\nimport { CalculatorAIInsightsComponent } from './calculator-ai-insights'\n`
    content = content.replace(importSection[0], newImports)
  }

  // Step 2: Add AI hook to component
  const componentMatch = content.match(/export function (\w+)\(\) \{/)
  if (componentMatch) {
    const hookDeclaration = `\n  // AI Insights\n  const { insights, loading: aiLoading, error: aiError, generateInsights } = useCalculatorAI()\n`
    content = content.replace(/export function \w+\(\) \{/, `$&${hookDeclaration}`)
  }

  // Step 3: Update calculate function to be async and call AI
  content = content.replace(
    /const calculate = \(\) => \{/g,
    'const calculate = async () => {'
  )

  // Step 4: Add AI insights call before setResult (find the last setResult in calculate function)
  const setResultPattern = /setResult\(([\s\S]*?)\)/g
  let matches = [...content.matchAll(setResultPattern)]
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1]
    const aiCallCode = `\n\n    // Generate AI insights\n    const resultData = ${lastMatch[1]}\n    setResult(resultData)\n    await generateInsights({\n      calculatorType: '${mapping.type}',\n      inputData: { /* Add relevant input data */ },\n      result: resultData\n    })`
    
    content = content.replace(lastMatch[0], aiCallCode)
  }

  // Step 5: Add Sparkles icon to Calculate button
  content = content.replace(
    /<Button onClick={calculate}(.*?)>Calculate(.*?)<\/Button>/,
    '<Button onClick={calculate}$1>\n            <Sparkles className="w-4 h-4 mr-2" />\n            Calculate$2 with AI Insights\n          </Button>'
  )

  // Step 6: Add AI Insights component at the end (before closing div)
  const closingDivPattern = /<\/div>\s*\)\s*\}\s*$/
  const aiInsightsComponent = `\n      {/* AI-Powered Insights */}\n      {result && (\n        <CalculatorAIInsightsComponent\n          insights={insights}\n          loading={aiLoading}\n          error={aiError}\n          onRefresh={() => generateInsights({\n            calculatorType: '${mapping.type}',\n            inputData: { /* Add relevant input data */ },\n            result\n          })}\n        />\n      )}\n    </div>\n  )\n}\n`
  
  content = content.replace(closingDivPattern, aiInsightsComponent)

  // Write enhanced file
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`✅ Enhanced ${mapping.file}`)
}

function main() {
  console.log('🚀 Starting calculator AI enhancement...\n')

  let enhanced = 0
  let skipped = 0

  for (const mapping of CALCULATOR_TYPES) {
    if (SKIP_FILES.includes(mapping.file)) {
      console.log(`⏭️  Skipping ${mapping.file} - utility tool`)
      skipped++
      continue
    }

    const filePath = path.join(CALCULATORS_DIR, mapping.file)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${mapping.file}`)
      continue
    }

    try {
      enhanceCalculator(filePath, mapping)
      enhanced++
    } catch (error) {
      console.error(`❌ Error enhancing ${mapping.file}:`, error)
    }
  }

  console.log(`\n✨ Enhancement complete!`)
  console.log(`✅ Enhanced: ${enhanced} calculators`)
  console.log(`⏭️  Skipped: ${skipped} calculators`)
}

main()

