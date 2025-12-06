'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestZillowPage() {
  const [address, setAddress] = useState('1600 Pennsylvania Avenue NW, Washington, DC 20500')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/zillow-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to fetch', message: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🏠 Test Zillow Scraper</CardTitle>
          <CardDescription>
            Test the Puppeteer-based Zillow property value scraper
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Property Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full address..."
            />
          </div>

          <Button 
            onClick={handleTest} 
            disabled={loading || !address}
            className="w-full"
          >
            {loading ? 'Scraping Zillow...' : 'Get Property Value'}
          </Button>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {result.success ? '✅ Success' : '⚠️ Result'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
                
                {result.estimatedValue && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      ${result.estimatedValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Source: {result.source} | Confidence: {result.confidence}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-semibold mb-2">📝 Test Addresses:</p>
            <ul className="text-xs space-y-1">
              <li>• 1600 Pennsylvania Avenue NW, Washington, DC 20500 (White House)</li>
              <li>• 1600 Amphitheatre Parkway, Mountain View, CA 94043 (Google)</li>
              <li>• 350 Fifth Avenue, New York, NY 10118 (Empire State Building)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






















