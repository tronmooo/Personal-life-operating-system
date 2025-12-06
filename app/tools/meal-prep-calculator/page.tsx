'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChefHat, Users, Calendar, DollarSign } from 'lucide-react'

export default function MealPrepCalculator() {
  const [people, setPeople] = useState('4')
  const [days, setDays] = useState('5')
  const [mealsPerDay, setMealsPerDay] = useState('2')
  const [costPerMeal, setCostPerMeal] = useState('5')
  const [prepTime, setPrepTime] = useState('3')
  
  const [result, setResult] = useState<{
    totalMeals: number
    totalCost: number
    totalPrepTime: number
    costSavings: number
    timeSavings: number
    servingsNeeded: number
  } | null>(null)

  const calculate = () => {
    const numPeople = parseInt(people)
    const numDays = parseInt(days)
    const meals = parseInt(mealsPerDay)
    const cost = parseFloat(costPerMeal)
    const time = parseFloat(prepTime)

    const totalMeals = numPeople * numDays * meals
    const servingsNeeded = totalMeals
    const totalCost = cost * servingsNeeded
    const totalPrepTime = time * numDays

    // Savings vs eating out ($12 avg restaurant meal, 45 min including travel/wait)
    const restaurantCost = 12
    const restaurantTime = 0.75 // 45 minutes
    
    const costSavings = (restaurantCost - cost) * servingsNeeded
    const timeSavings = (restaurantTime * servingsNeeded) - totalPrepTime

    setResult({
      totalMeals,
      totalCost,
      totalPrepTime,
      costSavings,
      timeSavings: timeSavings,
      servingsNeeded
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <ChefHat className="mr-3 h-10 w-10 text-primary" />
          Meal Prep Calculator
        </h1>
        <p className="text-muted-foreground">
          Plan your meal prep and calculate savings vs eating out
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meal Prep Details</CardTitle>
            <CardDescription>Enter your meal planning information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="people">Number of People</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="people"
                  type="number"
                  min="1"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Days to Prep For</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="days"
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meals">Meals Per Day</Label>
              <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Lunch or Dinner)</SelectItem>
                  <SelectItem value="2">2 (Lunch + Dinner)</SelectItem>
                  <SelectItem value="3">3 (All meals)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost Per Meal ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cost"
                  type="number"
                  step="0.5"
                  value={costPerMeal}
                  onChange={(e) => setCostPerMeal(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Average cost of ingredients per serving
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Prep Time Per Session (hours)</Label>
              <Input
                id="time"
                type="number"
                step="0.5"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Time to prep all meals for one day
              </p>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculate Meal Prep
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meal Prep Summary</CardTitle>
                <CardDescription>Your meal prep plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Meals</p>
                    <p className="text-3xl font-bold text-primary">
                      {result.totalMeals}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Servings Needed</p>
                    <p className="text-3xl font-bold text-primary">
                      {result.servingsNeeded}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-primary">
                      ${result.totalCost.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Prep Time</p>
                    <p className="text-2xl font-bold text-primary">
                      {result.totalPrepTime.toFixed(1)}hrs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings vs Eating Out</CardTitle>
                <CardDescription>Compared to restaurant meals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground mb-1">Cost Savings</p>
                  <p className="text-4xl font-bold text-green-600">
                    ${result.costSavings.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    vs eating out at $12/meal
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Time Savings</p>
                  <p className="text-2xl font-bold text-primary">
                    {result.timeSavings.toFixed(1)} hours
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs restaurant time (45 min/meal including travel)
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per meal:</span>
                    <span className="font-medium">${costPerMeal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per person/day:</span>
                    <span className="font-medium">
                      ${(result.totalCost / parseInt(people) / parseInt(days)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shopping List Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Shop for {result.servingsNeeded} servings total</p>
                <p>• Buy proteins in bulk and portion</p>
                <p>• Prep vegetables ahead of time</p>
                <p>• Use airtight containers for storage</p>
                <p>• Label meals with dates</p>
                <p>• Most meals last 4-5 days refrigerated</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Meal Prep Benefits</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold mb-2">💰 Save Money</p>
            <p className="text-muted-foreground">
              Cooking at home costs 3-5x less than eating out or ordering delivery.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">⏰ Save Time</p>
            <p className="text-muted-foreground">
              Batch cooking means you only cook once and eat all week. No daily cooking or ordering.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">🥗 Eat Healthier</p>
            <p className="text-muted-foreground">
              Control portions and ingredients. Avoid unhealthy restaurant food and temptations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






