'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function AnalyticsNavigation() {
  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">New: Advanced Analytics</h3>
              <Badge variant="default" className="bg-purple-600">v2.0</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Experience our completely redesigned analytics dashboard with AI-powered insights, 
              trend visualization, achievement tracking, and much more!
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Time-series trends</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>AI insights</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Interactive charts</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-orange-600" />
                <span>Goal tracking</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/analytics-v2">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Try Advanced Analytics
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline">
                  Classic View
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Preview Image Placeholder */}
          <div className="hidden lg:block w-48 h-32 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <BarChart3 className="h-16 w-16 text-white opacity-50" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




