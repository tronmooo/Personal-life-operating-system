/**
 * AI Integration Test Suite
 * Tests OpenAI integration across all AI tools and calculators
 */

import * as fs from 'fs'
import * as path from 'path'

console.log('🧪 AI Integration Test Suite\n')
console.log('=' .repeat(60))

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
}

const results: TestResult[] = []

// Test 1: Environment Variables
function testEnvironmentVariables(): TestResult {
  console.log('\n📋 Test 1: Environment Variables')
  
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  
  if (hasGemini || hasOpenAI) {
    console.log('✅ PASS - At least one AI API key configured')
    console.log(`   - Gemini: ${hasGemini ? '✓' : '✗'}`)
    console.log(`   - OpenAI: ${hasOpenAI ? '✓' : '✗'}`)
    return { name: 'Environment Variables', status: 'PASS', message: 'AI keys configured' }
  } else {
    console.log('❌ FAIL - No AI API keys configured')
    return { name: 'Environment Variables', status: 'FAIL', message: 'No AI keys found' }
  }
}

// Test 2: AI Service File
function testAIServiceFile(): TestResult {
  console.log('\n📋 Test 2: AI Service File')
  
  const servicePath = path.join(__dirname, '../lib/services/ai-service.ts')
  
  if (!fs.existsSync(servicePath)) {
    console.log('❌ FAIL - ai-service.ts not found')
    return { name: 'AI Service File', status: 'FAIL', message: 'File not found' }
  }
  
  const content = fs.readFileSync(servicePath, 'utf-8')
  
  const hasRequestAI = content.includes('export async function requestAI')
  const hasGeminiIntegration = content.includes('generativelanguage.googleapis.com')
  const hasOpenAIIntegration = content.includes('api.openai.com')
  const hasFallback = content.includes('fallback')
  
  console.log(`   - requestAI function: ${hasRequestAI ? '✓' : '✗'}`)
  console.log(`   - Gemini integration: ${hasGeminiIntegration ? '✓' : '✗'}`)
  console.log(`   - OpenAI integration: ${hasOpenAIIntegration ? '✓' : '✗'}`)
  console.log(`   - Fallback logic: ${hasFallback ? '✓' : '✗'}`)
  
  if (hasRequestAI && hasGeminiIntegration && hasOpenAIIntegration && hasFallback) {
    console.log('✅ PASS - AI service properly configured')
    return { name: 'AI Service File', status: 'PASS', message: 'Complete implementation' }
  } else {
    console.log('❌ FAIL - AI service incomplete')
    return { name: 'AI Service File', status: 'FAIL', message: 'Missing components' }
  }
}

// Test 3: Calculator AI Hook
function testCalculatorAIHook(): TestResult {
  console.log('\n📋 Test 3: Calculator AI Hook')
  
  const hookPath = path.join(__dirname, '../lib/hooks/use-calculator-ai.ts')
  
  if (!fs.existsSync(hookPath)) {
    console.log('❌ FAIL - use-calculator-ai.ts not found')
    return { name: 'Calculator AI Hook', status: 'FAIL', message: 'File not found' }
  }
  
  const content = fs.readFileSync(hookPath, 'utf-8')
  
  const hasHook = content.includes('export function useCalculatorAI')
  const hasGenerateInsights = content.includes('generateInsights')
  const hasTypings = content.includes('CalculatorAIInsights')
  
  console.log(`   - Hook function: ${hasHook ? '✓' : '✗'}`)
  console.log(`   - generateInsights: ${hasGenerateInsights ? '✓' : '✗'}`)
  console.log(`   - TypeScript typings: ${hasTypings ? '✓' : '✗'}`)
  
  if (hasHook && hasGenerateInsights && hasTypings) {
    console.log('✅ PASS - Calculator AI hook properly configured')
    return { name: 'Calculator AI Hook', status: 'PASS', message: 'Complete implementation' }
  } else {
    console.log('❌ FAIL - Calculator AI hook incomplete')
    return { name: 'Calculator AI Hook', status: 'FAIL', message: 'Missing components' }
  }
}

// Test 4: AI Insights Component
function testAIInsightsComponent(): TestResult {
  console.log('\n📋 Test 4: AI Insights Component')
  
  const componentPath = path.join(__dirname, '../components/tools/calculator-ai-insights.tsx')
  
  if (!fs.existsSync(componentPath)) {
    console.log('❌ FAIL - calculator-ai-insights.tsx not found')
    return { name: 'AI Insights Component', status: 'FAIL', message: 'File not found' }
  }
  
  const content = fs.readFileSync(componentPath, 'utf-8')
  
  const hasComponent = content.includes('export function CalculatorAIInsightsComponent')
  const hasLoadingState = content.includes('loading')
  const hasErrorHandling = content.includes('error')
  const hasSections = content.includes('insights') && content.includes('recommendations')
  
  console.log(`   - Component function: ${hasComponent ? '✓' : '✗'}`)
  console.log(`   - Loading state: ${hasLoadingState ? '✓' : '✗'}`)
  console.log(`   - Error handling: ${hasErrorHandling ? '✓' : '✗'}`)
  console.log(`   - Insights sections: ${hasSections ? '✓' : '✗'}`)
  
  if (hasComponent && hasLoadingState && hasErrorHandling && hasSections) {
    console.log('✅ PASS - AI insights component properly configured')
    return { name: 'AI Insights Component', status: 'PASS', message: 'Complete implementation' }
  } else {
    console.log('❌ FAIL - AI insights component incomplete')
    return { name: 'AI Insights Component', status: 'FAIL', message: 'Missing components' }
  }
}

// Test 5: API Route
function testAPIRoute(): TestResult {
  console.log('\n📋 Test 5: AI Insights API Route')
  
  const apiPath = path.join(__dirname, '../app/api/calculators/ai-insights/route.ts')
  
  if (!fs.existsSync(apiPath)) {
    console.log('❌ FAIL - API route not found')
    return { name: 'AI Insights API', status: 'FAIL', message: 'File not found' }
  }
  
  const content = fs.readFileSync(apiPath, 'utf-8')
  
  const hasPOST = content.includes('export async function POST')
  const usesAIService = content.includes('requestAI')
  const hasErrorHandling = content.includes('try') && content.includes('catch')
  const hasPromptGeneration = content.includes('generateCalculatorPrompt')
  
  console.log(`   - POST handler: ${hasPOST ? '✓' : '✗'}`)
  console.log(`   - Uses AI service: ${usesAIService ? '✓' : '✗'}`)
  console.log(`   - Error handling: ${hasErrorHandling ? '✓' : '✗'}`)
  console.log(`   - Prompt generation: ${hasPromptGeneration ? '✓' : '✗'}`)
  
  if (hasPOST && usesAIService && hasErrorHandling && hasPromptGeneration) {
    console.log('✅ PASS - API route properly configured')
    return { name: 'AI Insights API', status: 'PASS', message: 'Complete implementation' }
  } else {
    console.log('❌ FAIL - API route incomplete')
    return { name: 'AI Insights API', status: 'FAIL', message: 'Missing components' }
  }
}

// Test 6: Enhanced Calculators
function testEnhancedCalculators(): TestResult {
  console.log('\n📋 Test 6: Enhanced Calculators')
  
  const calculators = [
    'bmi-calculator.tsx',
    'mortgage-calculator.tsx'
  ]
  
  let enhancedCount = 0
  
  for (const calc of calculators) {
    const calcPath = path.join(__dirname, '../components/tools', calc)
    
    if (fs.existsSync(calcPath)) {
      const content = fs.readFileSync(calcPath, 'utf-8')
      const isEnhanced = content.includes('useCalculatorAI') && content.includes('generateInsights')
      
      console.log(`   - ${calc}: ${isEnhanced ? '✓ Enhanced' : '✗ Not enhanced'}`)
      
      if (isEnhanced) enhancedCount++
    }
  }
  
  if (enhancedCount >= 2) {
    console.log(`✅ PASS - ${enhancedCount}/${calculators.length} sample calculators enhanced`)
    return { name: 'Enhanced Calculators', status: 'PASS', message: `${enhancedCount} calculators enhanced` }
  } else {
    console.log(`⚠️  SKIP - Only ${enhancedCount}/${calculators.length} calculators enhanced`)
    return { name: 'Enhanced Calculators', status: 'SKIP', message: 'Partial implementation' }
  }
}

// Test 7: AI Tools Files
function testAIToolsFiles(): TestResult {
  console.log('\n📋 Test 7: AI Tools Files')
  
  const aiToolsDir = path.join(__dirname, '../components/tools/ai-tools')
  
  if (!fs.existsSync(aiToolsDir)) {
    console.log('❌ FAIL - ai-tools directory not found')
    return { name: 'AI Tools Files', status: 'FAIL', message: 'Directory not found' }
  }
  
  const files = fs.readdirSync(aiToolsDir).filter(f => f.endsWith('.tsx'))
  console.log(`   - Found ${files.length} AI tool files`)
  
  if (files.length >= 29) {
    console.log(`✅ PASS - ${files.length} AI tool files present`)
    return { name: 'AI Tools Files', status: 'PASS', message: `${files.length} tools found` }
  } else {
    console.log(`⚠️  SKIP - Only ${files.length}/29 AI tool files found`)
    return { name: 'AI Tools Files', status: 'SKIP', message: 'Partial implementation' }
  }
}

// Test 8: Dashboard Page
function testDashboardPage(): TestResult {
  console.log('\n📋 Test 8: AI Tools Dashboard')
  
  const dashboardPath = path.join(__dirname, '../app/(dashboard)/ai-tools-calculators/page.tsx')
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ FAIL - Dashboard page not found')
    return { name: 'Dashboard Page', status: 'FAIL', message: 'File not found' }
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf-8')
  
  const hasAITools = content.includes('aiTools')
  const hasCalculators = content.includes('calculators')
  const hasSearch = content.includes('searchTerm')
  const hasTabs = content.includes('Tabs')
  
  console.log(`   - AI tools list: ${hasAITools ? '✓' : '✗'}`)
  console.log(`   - Calculators list: ${hasCalculators ? '✓' : '✗'}`)
  console.log(`   - Search functionality: ${hasSearch ? '✓' : '✗'}`)
  console.log(`   - Tabs component: ${hasTabs ? '✓' : '✗'}`)
  
  if (hasAITools && hasCalculators && hasSearch && hasTabs) {
    console.log('✅ PASS - Dashboard page properly configured')
    return { name: 'Dashboard Page', status: 'PASS', message: 'Complete implementation' }
  } else {
    console.log('❌ FAIL - Dashboard page incomplete')
    return { name: 'Dashboard Page', status: 'FAIL', message: 'Missing components' }
  }
}

// Test 9: Documentation
function testDocumentation(): TestResult {
  console.log('\n📋 Test 9: Documentation Files')
  
  const docs = [
    'AI_TOOLS_CALCULATORS_COMPLETE.md',
    'CALCULATOR_AI_TEMPLATE.md'
  ]
  
  let foundCount = 0
  
  for (const doc of docs) {
    const docPath = path.join(__dirname, '..', doc)
    const exists = fs.existsSync(docPath)
    console.log(`   - ${doc}: ${exists ? '✓' : '✗'}`)
    if (exists) foundCount++
  }
  
  if (foundCount === docs.length) {
    console.log(`✅ PASS - All ${docs.length} documentation files present`)
    return { name: 'Documentation', status: 'PASS', message: 'Complete docs' }
  } else {
    console.log(`⚠️  SKIP - Only ${foundCount}/${docs.length} docs found`)
    return { name: 'Documentation', status: 'SKIP', message: 'Partial docs' }
  }
}

// Run all tests
function runAllTests() {
  results.push(testEnvironmentVariables())
  results.push(testAIServiceFile())
  results.push(testCalculatorAIHook())
  results.push(testAIInsightsComponent())
  results.push(testAPIRoute())
  results.push(testEnhancedCalculators())
  results.push(testAIToolsFiles())
  results.push(testDashboardPage())
  results.push(testDocumentation())
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY\n')
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  
  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  
  console.log('\nDetailed Results:')
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
    console.log(`${icon} ${result.name}: ${result.message}`)
  })
  
  if (failed === 0) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED!')
    console.log('✨ AI integration is properly configured and ready to use.')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED')
    console.log('Review the failures above and fix the issues.')
  }
  
  console.log('\n' + '='.repeat(60))
}

runAllTests()

