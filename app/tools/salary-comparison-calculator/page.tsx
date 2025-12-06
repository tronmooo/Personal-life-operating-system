'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DollarSign, Briefcase } from 'lucide-react'

export default function SalaryComparisonCalculator() {
  // Job A
  const [salaryA, setSalaryA] = useState('85000')
  const [bonusA, setBonusA] = useState('5000')
  const [benefitsA, setBenefitsA] = useState('8000')
  const [commuteA, setCommuteA] = useState('30')
  const [ptoA, setPtoA] = useState('15')

  // Job B
  const [salaryB, setSalaryB] = useState('95000')
  const [bonusB, setBonusB] = useState('0')
  const [benefitsB, setBenefitsB] = useState('10000')
  const [commuteB, setCommuteB] = useState('60')
  const [ptoB, setPtoB] = useState('10')

  const [result, setResult] = useState<{
    totalCompA: number
    totalCompB: number
    hourlyA: number
    hourlyB: number
    effectiveA: number
    effectiveB: number
    recommendation: string
  } | null>(null)

  const calculate = () => {
    const salA = parseFloat(salaryA)
    const bonA = parseFloat(bonusA)
    const benA = parseFloat(benefitsA)
    const commA = parseFloat(commuteA)
    const vacA = parseFloat(ptoA)

    const salB = parseFloat(salaryB)
    const bonB = parseFloat(bonusB)
    const benB = parseFloat(benefitsB)
    const commB = parseFloat(commuteB)
    const vacB = parseFloat(ptoB)

    // Total compensation
    const totalCompA = salA + bonA + benA
    const totalCompB = salB + bonB + benB

    // Working hours (assuming 40 hour weeks, 52 weeks)
    const workingHoursPerYear = 2080
    const workingDaysPerYear = 260

    // Hourly rate
    const hourlyA = totalCompA / workingHoursPerYear
    const hourlyB = totalCompB / workingHoursPerYear

    // Commute time cost (at hourly rate, 2 trips per day)
    const commuteHoursA = (commA / 60) * 2 * workingDaysPerYear
    const commuteHoursB = (commB / 60) * 2 * workingDaysPerYear
    const commuteCostA = commuteHoursA * hourlyA
    const commuteCostB = commuteHoursB * hourlyB

    // PTO value (more PTO = more value)
    const ptoValueA = vacA * 8 * hourlyA
    const ptoValueB = vacB * 8 * hourlyB

    // Effective compensation (total comp - commute cost)
    const effectiveA = totalCompA - commuteCostA
    const effectiveB = totalCompB - commuteCostB

    let recommendation = ''
    const diff = Math.abs(effectiveA - effectiveB)
    if (effectiveA > effectiveB) {
      recommendation = `Job A is better by $${diff.toFixed(0)} effective compensation`
    } else if (effectiveB > effectiveA) {
      recommendation = `Job B is better by $${diff.toFixed(0)} effective compensation`
    } else {
      recommendation = 'Both jobs offer similar effective compensation'
    }

    setResult({
      totalCompA,
      totalCompB,
      hourlyA,
      hourlyB,
      effectiveA,
      effectiveB,
      recommendation
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Briefcase className="mr-3 h-10 w-10 text-primary" />
          Salary Comparison Calculator
        </h1>
        <p className="text-muted-foreground">
          Compare two job offers including salary, benefits, commute, and time off
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-900/10">
            <CardTitle>Job A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Base Salary</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={salaryA}
                  onChange={(e) => setSalaryA(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Annual Bonus</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={bonusA}
                  onChange={(e) => setBonusA(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Benefits Value (yearly)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={benefitsA}
                  onChange={(e) => setBenefitsA(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Commute (minutes one-way)</Label>
              <Input
                type="number"
                value={commuteA}
                onChange={(e) => setCommuteA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>PTO Days</Label>
              <Input
                type="number"
                value={ptoA}
                onChange={(e) => setPtoA(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/10">
            <CardTitle>Job B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Base Salary</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={salaryB}
                  onChange={(e) => setSalaryB(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Annual Bonus</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={bonusB}
                  onChange={(e) => setBonusB(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Benefits Value (yearly)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={benefitsB}
                  onChange={(e) => setBenefitsB(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Commute (minutes one-way)</Label>
              <Input
                type="number"
                value={commuteB}
                onChange={(e) => setCommuteB(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>PTO Days</Label>
              <Input
                type="number"
                value={ptoB}
                onChange={(e) => setPtoB(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Comparison</CardTitle>
              <CardDescription>Side-by-side analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                  Recommendation:
                </p>
                <p className="text-sm text-purple-900 dark:text-purple-300">
                  {result.recommendation}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Compensation</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                      <p className="text-sm font-bold">${result.totalCompA.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Job A</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                      <p className="text-sm font-bold">${result.totalCompB.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Job B</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hourly Rate</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                      <p className="text-sm font-bold">${result.hourlyA.toFixed(2)}/hr</p>
                      <p className="text-xs text-muted-foreground">Job A</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                      <p className="text-sm font-bold">${result.hourlyB.toFixed(2)}/hr</p>
                      <p className="text-xs text-muted-foreground">Job B</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Effective Compensation</p>
                  <p className="text-xs text-muted-foreground mb-2">(after commute time cost)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                      <p className="text-sm font-bold">${result.effectiveA.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Job A</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                      <p className="text-sm font-bold">${result.effectiveB.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Job B</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t text-xs text-muted-foreground">
                <p>
                  <strong>Note:</strong> Consider other factors like growth opportunities, 
                  work-life balance, company culture, and job satisfaction.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={calculate} className="lg:col-span-3 w-full" size="lg">
          Compare Jobs
        </Button>
      </div>
    </div>
  )
}






