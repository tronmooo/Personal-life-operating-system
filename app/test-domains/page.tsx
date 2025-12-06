'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, PlayCircle } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Domain } from '@/types/domains'

interface DomainTest {
  id: Domain
  name: string
  icon: string
  status: 'pending' | 'testing' | 'passed' | 'failed'
  error?: string
  entryCount: number
}

export default function TestDomainsPage() {
  const { getData, addData, updateData, deleteData } = useData()
  const [tests, setTests] = useState<DomainTest[]>([
    { id: 'financial', name: 'Financial', icon: '💰', status: 'pending', entryCount: 0 },
    { id: 'health', name: 'Health', icon: '❤️', status: 'pending', entryCount: 0 },
    { id: 'insurance', name: 'Insurance', icon: '🛡️', status: 'pending', entryCount: 0 },
    { id: 'home', name: 'Home', icon: '🏠', status: 'pending', entryCount: 0 },
    { id: 'vehicles', name: 'Vehicles', icon: '🚗', status: 'pending', entryCount: 0 },
    { id: 'appliances', name: 'Appliances', icon: '🔧', status: 'pending', entryCount: 0 },
    { id: 'pets', name: 'Pets', icon: '🐾', status: 'pending', entryCount: 0 },
    { id: 'relationships', name: 'Relationships', icon: '👥', status: 'pending', entryCount: 0 },
    { id: 'digital', name: 'Digital', icon: '💻', status: 'pending', entryCount: 0 },
    { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', status: 'pending', entryCount: 0 },
    { id: 'fitness', name: 'Fitness', icon: '💪', status: 'pending', entryCount: 0 },
    { id: 'nutrition', name: 'Nutrition', icon: '🍎', status: 'pending', entryCount: 0 },
    { id: 'miscellaneous', name: 'Miscellaneous', icon: '🎨', status: 'pending', entryCount: 0 },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)

  const getTestData = (domain: Domain) => {
    const testData: Partial<Record<Domain, any>> = {
      financial: { title: 'Test Account', metadata: { accountType: 'checking', balance: 1000 } },
      health: { title: 'Test Vital', metadata: { type: 'vitals', weight: 150 } },
      insurance: { title: 'Test Policy', metadata: { itemType: 'policy', provider: 'Test Inc' } },
      home: { title: 'Test Property', metadata: { type: 'property', address: '123 Test St' } },
      vehicles: { title: 'Test Car', metadata: { make: 'Toyota', model: 'Camry', year: 2020 } },
      appliances: { title: 'Test Fridge', metadata: { name: 'Test', category: 'Kitchen' } },
      pets: { title: 'Test Pet', metadata: { itemType: 'profile', name: 'Test Dog', species: 'Dog' } },
      relationships: { title: 'Test Contact', metadata: { name: 'Test Person', relationship: 'friend' } },
      digital: { title: 'Test Sub', metadata: { serviceName: 'Test', monthlyCost: 9.99 } },
      mindfulness: { title: 'Test Meditation', metadata: { type: 'meditation', duration: 10 } },
      fitness: { title: 'Test Workout', metadata: { type: 'workout', activityType: 'running' } },
      nutrition: { title: 'Test Meal', metadata: { type: 'meal', mealType: 'breakfast', calories: 400 } },
      miscellaneous: { title: 'Test Item', metadata: { category: 'general' } },
    }
    return testData[domain]
  }

  const testDomain = async (domainTest: DomainTest): Promise<void> => {
    setCurrentTest(domainTest.id)
    
    // Update status to testing
    setTests(prev => prev.map(t => 
      t.id === domainTest.id ? { ...t, status: 'testing' as const } : t
    ))

    try {
      // Test 1: Read existing data
      const existingData = getData(domainTest.id)
      const entryCount = existingData.length

      // Test 2: Create a test entry
      const testData = getTestData(domainTest.id)
      await addData(domainTest.id, testData)

      // Test 3: Read again to verify
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for state update
      const updatedData = getData(domainTest.id)
      
      if (updatedData.length > entryCount) {
        // Success - created entry
        const newEntry = updatedData[updatedData.length - 1]
        
        // Test 4: Update the entry
        await updateData(domainTest.id, newEntry.id, { 
          title: `${testData.title} (Updated)` 
        })

        // Test 5: Delete the test entry
        await deleteData(domainTest.id, newEntry.id)

        // Mark as passed
        setTests(prev => prev.map(t => 
          t.id === domainTest.id 
            ? { ...t, status: 'passed' as const, entryCount, error: undefined } 
            : t
        ))
      } else {
        throw new Error('Entry was not created')
      }
    } catch (error: any) {
      console.error(`Test failed for ${domainTest.name}:`, error)
      setTests(prev => prev.map(t => 
        t.id === domainTest.id 
          ? { ...t, status: 'failed' as const, error: error.message } 
          : t
      ))
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    for (const test of tests) {
      await testDomain(test)
      await new Promise(resolve => setTimeout(resolve, 500)) // Delay between tests
    }
    
    setIsRunning(false)
    setCurrentTest(null)
  }

  const runSingleTest = async (domainId: Domain) => {
    const test = tests.find(t => t.id === domainId)
    if (test) {
      setIsRunning(true)
      await testDomain(test)
      setIsRunning(false)
      setCurrentTest(null)
    }
  }

  const resetTests = () => {
    setTests(prev => prev.map(t => ({ ...t, status: 'pending' as const, error: undefined })))
    setCurrentTest(null)
  }

  const passedCount = tests.filter(t => t.status === 'passed').length
  const failedCount = tests.filter(t => t.status === 'failed').length
  const totalCount = tests.length

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🧪 Domain Functionality Tests</h1>
        <p className="text-muted-foreground">
          Test all domains to ensure Create, Read, Update, and Delete operations work correctly
        </p>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Run tests to verify domain functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
            <Button 
              onClick={resetTests} 
              variant="outline"
              disabled={isRunning}
            >
              Reset
            </Button>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{passedCount}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((test) => (
          <Card 
            key={test.id}
            className={`${
              test.status === 'testing' ? 'ring-2 ring-blue-500' :
              test.status === 'passed' ? 'ring-2 ring-green-500' :
              test.status === 'failed' ? 'ring-2 ring-red-500' :
              ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{test.icon}</span>
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                {test.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {test.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                {test.status === 'testing' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={
                  test.status === 'passed' ? 'default' :
                  test.status === 'failed' ? 'destructive' :
                  test.status === 'testing' ? 'secondary' :
                  'outline'
                }>
                  {test.status}
                </Badge>
              </div>
              
              {test.status === 'passed' && (
                <div className="text-sm text-muted-foreground">
                  ✅ CRUD operations working
                  {test.entryCount > 0 && (
                    <div className="mt-1">📊 {test.entryCount} existing entries</div>
                  )}
                </div>
              )}
              
              {test.status === 'failed' && test.error && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Error: {test.error}
                </div>
              )}

              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => runSingleTest(test.id)}
                disabled={isRunning}
              >
                Test {test.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Testing Reminder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 Manual Testing Checklist</CardTitle>
          <CardDescription>After automated tests pass, manually verify these features</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Dashboard cards display correct counts</li>
            <li>Clicking each card navigates to domain page</li>
            <li>Add buttons work in each domain</li>
            <li>Edit buttons work for existing entries</li>
            <li>Delete confirmation dialogs appear</li>
            <li>Data persists after page refresh</li>
            <li>No console errors (press F12 to check)</li>
            <li>Toast notifications show success messages</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

