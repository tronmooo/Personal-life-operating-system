'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Sparkles, Save } from 'lucide-react'
import { useCalculatorAI } from '@/lib/hooks/use-calculator-ai'
import { CalculatorAIInsightsComponent } from './calculator-ai-insights'
import { useDomainTools } from '@/lib/hooks/use-domain-tools'
import { DomainDataBanner } from './domain-data-banner'
import { SaveToDomain } from './save-to-domain'

export function BMICalculator() {
  const [system, setSystem] = useState<'metric' | 'imperial'>('imperial')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [bmi, setBmi] = useState<number | null>(null)
  
  // AI Insights
  const { insights, loading: aiLoading, error: aiError, generateInsights } = useCalculatorAI()
  
  // Domain Integration - Auto-fill from health domain
  const { 
    autoFillData, 
    saveResult, 
    isAutoFilled, 
    loading: domainLoading,
    refreshData,
    domainItems,
    relevantDomains 
  } = useDomainTools('bmi-calculator')

  // Auto-fill from domain data on mount
  useEffect(() => {
    if (!domainLoading && isAutoFilled) {
      const healthData = autoFillData.health
      
      // Auto-fill weight
      if (healthData.weight && !weight) {
        if (healthData.weightUnit === 'kg' && system === 'imperial') {
          // Convert kg to lbs
          setWeight(String(Math.round(healthData.weight * 2.20462)))
        } else if (healthData.weightUnit === 'lbs' && system === 'metric') {
          // Convert lbs to kg
          setWeight(String(Math.round(healthData.weight / 2.20462)))
        } else {
          setWeight(String(healthData.weight))
        }
      }
      
      // Auto-fill height
      if (system === 'imperial') {
        if (healthData.heightFeet && !feet) {
          setFeet(String(healthData.heightFeet))
        }
        if (healthData.heightInches !== undefined && !inches) {
          setInches(String(healthData.heightInches))
        }
        // Convert from cm if needed
        if (healthData.height && healthData.heightUnit === 'cm' && !feet) {
          const totalInches = healthData.height / 2.54
          setFeet(String(Math.floor(totalInches / 12)))
          setInches(String(Math.round(totalInches % 12)))
        }
      } else {
        if (healthData.height && !height) {
          if (healthData.heightUnit === 'in' || healthData.heightUnit === 'inches') {
            // Convert inches to cm
            setHeight(String(Math.round(healthData.height * 2.54)))
          } else {
            setHeight(String(healthData.height))
          }
        }
        // Convert from feet/inches if available
        if (healthData.heightFeet && !height) {
          const totalInches = (healthData.heightFeet * 12) + (healthData.heightInches || 0)
          setHeight(String(Math.round(totalInches * 2.54)))
        }
      }
    }
  }, [domainLoading, isAutoFilled, autoFillData, system])

  const calculate = async () => {
    let bmiValue: number

    if (system === 'metric') {
      const w = parseFloat(weight)
      const h = parseFloat(height) / 100 // convert cm to m
      bmiValue = w / (h * h)
    } else {
      const w = parseFloat(weight)
      const h = (parseFloat(feet) * 12) + parseFloat(inches)
      bmiValue = (w / (h * h)) * 703
    }

    setBmi(bmiValue)
    
    // Generate AI insights
    const category = getBMICategory(bmiValue)
    await generateInsights({
      calculatorType: 'bmi',
      inputData: {
        weight: parseFloat(weight),
        height: system === 'metric' ? parseFloat(height) : (parseFloat(feet) * 12) + parseFloat(inches),
        system,
        heightUnit: system === 'metric' ? 'cm' : 'inches',
        weightUnit: system === 'metric' ? 'kg' : 'lbs',
        age: autoFillData.health.age || undefined,
        gender: autoFillData.health.gender || undefined
      },
      result: {
        bmi: bmiValue,
        category: category.label
      }
    })
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' }
    if (bmi < 25) return { label: 'Normal weight', color: 'text-green-600' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600' }
    return { label: 'Obese', color: 'text-red-600' }
  }

  // Prepare result data for saving
  const getResultData = () => ({
    type: 'bmi',
    bmi: bmi,
    category: bmi ? getBMICategory(bmi).label : null,
    weight: parseFloat(weight),
    weightUnit: system === 'metric' ? 'kg' : 'lbs',
    height: system === 'metric' ? parseFloat(height) : (parseFloat(feet) * 12) + parseFloat(inches),
    heightUnit: system === 'metric' ? 'cm' : 'inches',
    system,
    date: new Date().toISOString(),
  })

  return (
    <div className="space-y-6">
      {/* Domain Data Banner - Shows auto-fill status */}
      <DomainDataBanner
        isAutoFilled={isAutoFilled}
        relevantDomains={relevantDomains}
        domainItems={domainItems}
        loading={domainLoading}
        onRefresh={refreshData}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              BMI Calculator
            </div>
            {bmi !== null && (
              <SaveToDomain
                toolType="bmi-calculator"
                suggestedTitle={`BMI: ${bmi.toFixed(1)} - ${getBMICategory(bmi).label}`}
                resultData={getResultData()}
                description={`BMI measurement of ${bmi.toFixed(1)} (${getBMICategory(bmi).label}) calculated on ${new Date().toLocaleDateString()}`}
                resultType="bmi"
                onSave={saveResult}
              />
            )}
          </CardTitle>
          <CardDescription>
            Calculate your Body Mass Index to assess your body weight
            {isAutoFilled && (
              <span className="ml-2 text-purple-600 dark:text-purple-400">
                • Auto-filled from your health data
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={system} onValueChange={(v) => setSystem(v as 'metric' | 'imperial')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="imperial">Imperial (lbs/ft)</TabsTrigger>
              <TabsTrigger value="metric">Metric (kg/cm)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight {system === 'metric' ? '(kg)' : '(lbs)'}
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder={system === 'metric' ? '70' : '154'}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            {system === 'metric' ? (
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="feet">Height (feet)</Label>
                  <Input
                    id="feet"
                    type="number"
                    placeholder="5"
                    value={feet}
                    onChange={(e) => setFeet(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inches">Height (inches)</Label>
                  <Input
                    id="inches"
                    type="number"
                    placeholder="9"
                    value={inches}
                    onChange={(e) => setInches(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <Button onClick={calculate} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Calculate BMI with AI Insights
          </Button>

          {bmi !== null && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your BMI</p>
                  <p className="text-4xl font-bold text-primary">{bmi.toFixed(1)}</p>
                  <p className={`text-lg font-semibold mt-2 ${getBMICategory(bmi).color}`}>
                    {getBMICategory(bmi).label}
                  </p>
                  
                  <div className="mt-6 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span>Underweight</span>
                      <span className="text-muted-foreground">&lt; 18.5</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Normal weight</span>
                      <span className="text-muted-foreground">18.5 - 24.9</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overweight</span>
                      <span className="text-muted-foreground">25 - 29.9</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Obese</span>
                      <span className="text-muted-foreground">≥ 30</span>
                    </div>
                  </div>
                  
                  {/* Save Result Prompt */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      💾 Save this measurement to track your progress over time
                    </p>
                    <SaveToDomain
                      toolType="bmi-calculator"
                      suggestedTitle={`BMI: ${bmi.toFixed(1)} - ${getBMICategory(bmi).label}`}
                      resultData={getResultData()}
                      description={`BMI measurement of ${bmi.toFixed(1)} (${getBMICategory(bmi).label})`}
                      resultType="bmi"
                      onSave={saveResult}
                      trigger={
                        <Button variant="outline" className="w-full">
                          <Save className="h-4 w-4 mr-2" />
                          Save to Health Domain
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Insights */}
      {bmi !== null && (
        <CalculatorAIInsightsComponent
          insights={insights}
          loading={aiLoading}
          error={aiError}
          onRefresh={() => {
            const category = getBMICategory(bmi)
            generateInsights({
              calculatorType: 'bmi',
              inputData: {
                weight: parseFloat(weight),
                height: system === 'metric' ? parseFloat(height) : (parseFloat(feet) * 12) + parseFloat(inches),
                system,
                heightUnit: system === 'metric' ? 'cm' : 'inches',
                weightUnit: system === 'metric' ? 'kg' : 'lbs',
                age: autoFillData.health.age || undefined,
                gender: autoFillData.health.gender || undefined
              },
              result: {
                bmi,
                category: category.label
              }
            })
          }}
        />
      )}
    </div>
  )
}
