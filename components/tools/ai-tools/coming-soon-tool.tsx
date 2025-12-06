'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle } from 'lucide-react'

interface ComingSoonToolProps {
  name: string
  description: string
  features: string[]
  icon: string
}

export function ComingSoonTool({ name, description, features, icon }: ComingSoonToolProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-3xl">{icon}</span>
            {name}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="text-lg">Coming Soon Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-bold mb-2">Under Development</h3>
            <p className="text-muted-foreground">
              This tool is being built! Check back soon for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}































