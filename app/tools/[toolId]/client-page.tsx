'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { CompoundInterestCalculator } from '@/components/tools/compound-interest-calculator'
import { BMICalculator } from '@/components/tools/bmi-calculator'
import { MortgageCalculator } from '@/components/tools/mortgage-calculator'
import { CalorieCalculator } from '@/components/tools/calorie-calculator'

const toolComponents: Record<string, React.ComponentType> = {
  'compound-interest': CompoundInterestCalculator,
  'bmi-calculator': BMICalculator,
  'mortgage-calculator': MortgageCalculator,
  'calorie-calculator': CalorieCalculator,
}

export function ToolPageClient({ toolId }: { toolId: string }) {
  const router = useRouter()

  const ToolComponent = toolComponents[toolId]

  if (!ToolComponent) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Tool Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This tool is not yet implemented or doesn't exist.
          </p>
          <Button onClick={() => router.push('/tools')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/tools" className="hover:text-foreground flex items-center">
          <ChevronLeft className="h-4 w-4" />
          Tools
        </Link>
      </div>

      {/* Tool Component */}
      <ToolComponent />
    </div>
  )
}
















