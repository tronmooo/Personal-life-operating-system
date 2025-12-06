'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DOMAIN_CONFIGS, Domain } from '@/types/domains'
import { Trash2, Plus, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function TestCRUDPage() {
  const { getData, addData, deleteData } = useData()
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState<string | null>(null)

  const testDomains = Object.keys(DOMAIN_CONFIGS) as Domain[]

  const testCRUD = async (domain: Domain) => {
    setTesting(domain)
    const results: any = {
      domain,
      steps: [],
      success: false
    }

    try {
      // Step 1: Read existing data
      results.steps.push({ name: 'READ', status: 'running' })
      const existingData = getData(domain)
      results.steps[0].status = 'success'
      results.steps[0].count = existingData?.length || 0
      results.steps.push({ name: `Found ${existingData?.length || 0} existing entries`, status: 'info' })

      // Step 2: Create new entry
      results.steps.push({ name: 'CREATE', status: 'running' })
      const testEntry = {
        title: `Test Entry - ${new Date().toLocaleTimeString()}`,
        description: 'Test entry created by CRUD diagnostic',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }

      await addData(domain, testEntry)

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataAfterCreate = getData(domain)
      const createdEntry = dataAfterCreate?.find(e => e.metadata?.test === true)

      if (createdEntry) {
        results.steps[results.steps.length - 1].status = 'success'
        results.steps[results.steps.length - 1].id = createdEntry.id
        results.steps.push({ name: `Created entry ID: ${createdEntry.id}`, status: 'info' })
      } else {
        results.steps[results.steps.length - 1].status = 'error'
        results.steps[results.steps.length - 1].error = 'Entry not found after creation'
        throw new Error('Entry not found after creation')
      }

      // Step 3: Delete the entry
      results.steps.push({ name: 'DELETE', status: 'running' })
      await deleteData(domain, createdEntry.id)

      // Wait a moment for the delete to propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataAfterDelete = getData(domain)
      const stillExists = dataAfterDelete?.find(e => e.id === createdEntry.id)

      if (!stillExists) {
        results.steps[results.steps.length - 1].status = 'success'
        results.steps.push({ name: 'Entry successfully deleted', status: 'info' })
        results.success = true
      } else {
        results.steps[results.steps.length - 1].status = 'error'
        results.steps[results.steps.length - 1].error = 'Entry still exists after delete'
        throw new Error('Entry still exists after delete')
      }

    } catch (error: any) {
      results.success = false
      results.error = error.message || String(error)
      results.steps.push({ name: 'ERROR', status: 'error', error: error.message })
    }

    setTestResults(prev => ({ ...prev, [domain]: results }))
    setTesting(null)
  }

  const testAllDomains = async () => {
    for (const domain of testDomains) {
      await testCRUD(domain)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const clearResults = () => {
    setTestResults({})
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRUD Diagnostic Test</h1>
          <p className="text-muted-foreground mt-2">
            Test Create, Read, Update, Delete operations across all domains
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearResults} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
          <Button onClick={testAllDomains} disabled={testing !== null}>
            {testing ? 'Testing...' : 'Test All Domains'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testDomains.map(domain => {
          const config = DOMAIN_CONFIGS[domain]
          const result = testResults[domain]
          const isTesting = testing === domain

          return (
            <Card key={domain} className={isTesting ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  {result && (
                    result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )
                  )}
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => testCRUD(domain)}
                  disabled={testing !== null}
                  className="w-full"
                  variant={result?.success ? 'outline' : 'default'}
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Test CRUD
                    </>
                  )}
                </Button>

                {result && (
                  <div className="space-y-2 text-sm">
                    {result.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        {step.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                        {step.status === 'error' && (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        {step.status === 'running' && (
                          <RefreshCw className="h-4 w-4 text-blue-600 flex-shrink-0 animate-spin" />
                        )}
                        {step.status === 'info' && (
                          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                        <span className={step.status === 'error' ? 'text-red-600' : ''}>
                          {step.name}
                        </span>
                      </div>
                    ))}
                    {result.error && (
                      <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-xs">
                        {result.error}
                      </div>
                    )}
                  </div>
                )}

                {!result && (
                  <p className="text-sm text-muted-foreground">
                    Click "Test CRUD" to test Create, Read, and Delete operations
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {Object.values(testResults).filter((r: any) => r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">
                  {Object.values(testResults).filter((r: any) => !r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {Object.keys(testResults).length}
                </div>
                <div className="text-sm text-muted-foreground">Total Tested</div>
              </div>
            </div>

            {Object.values(testResults).some((r: any) => !r.success) && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Failed Domains:</h3>
                <div className="space-y-1">
                  {Object.entries(testResults)
                    .filter(([_, r]: any) => !r.success)
                    .map(([domain, result]: any) => (
                      <div key={domain} className="text-sm text-red-600">
                        • {DOMAIN_CONFIGS[domain as Domain].name}: {result.error}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
