'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Calendar, Clock, TrendingUp } from 'lucide-react'

export default function StudyTimeCalculator() {
  const [examDate, setExamDate] = useState('')
  const [hoursAvailablePerDay, setHoursAvailablePerDay] = useState('2')
  const [currentKnowledge, setCurrentKnowledge] = useState('30')
  const [targetScore, setTargetScore] = useState('90')
  const [difficulty, setDifficulty] = useState('medium')
  
  const [result, setResult] = useState<{
    daysUntilExam: number
    totalStudyHours: number
    studyHoursPerDay: number
    recommendedSessions: number
    studySchedule: string[]
    warning: string
  } | null>(null)

  const calculate = () => {
    if (!examDate) return

    const today = new Date()
    const exam = new Date(examDate)
    const daysUntilExam = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExam <= 0) {
      setResult({
        daysUntilExam: 0,
        totalStudyHours: 0,
        studyHoursPerDay: 0,
        recommendedSessions: 0,
        studySchedule: [],
        warning: 'Exam date has passed or is today!'
      })
      return
    }

    const current = parseFloat(currentKnowledge)
    const target = parseFloat(targetScore)
    const availableHours = parseFloat(hoursAvailablePerDay)
    
    // Calculate knowledge gap
    const knowledgeGap = target - current

    // Difficulty multipliers
    const difficultyMultipliers: any = {
      'easy': 0.5,
      'medium': 1.0,
      'hard': 1.5,
      'very-hard': 2.0
    }

    // Base hours needed per percentage point
    const baseHoursPerPoint = 2 // 2 hours per percentage point improvement
    const multiplier = difficultyMultipliers[difficulty]

    // Calculate total study hours needed
    const totalStudyHours = Math.ceil(knowledgeGap * baseHoursPerPoint * multiplier)

    // Calculate required hours per day
    const studyHoursPerDay = totalStudyHours / daysUntilExam

    // Recommended study sessions (25-min pomodoros)
    const recommendedSessions = Math.ceil(studyHoursPerDay * 2) // 2 pomodoros per hour

    // Generate study schedule
    const studySchedule: string[] = []
    const weeks = Math.ceil(daysUntilExam / 7)
    
    if (weeks <= 1) {
      studySchedule.push('Week 1: Review all material, focus on weak areas')
      studySchedule.push('Last 2 days: Practice tests and final review')
    } else if (weeks <= 4) {
      studySchedule.push('Week 1-2: Learn new material, take notes')
      studySchedule.push('Week 3: Practice problems and review')
      studySchedule.push('Week 4: Mock exams and weak area focus')
    } else {
      studySchedule.push('First 40%: Learn all new material thoroughly')
      studySchedule.push('Middle 30%: Practice and problem-solving')
      studySchedule.push('Last 30%: Review, mock exams, weak areas')
      studySchedule.push('Final week: Light review and confidence building')
    }

    // Warning if not enough time
    let warning = ''
    if (studyHoursPerDay > availableHours) {
      warning = `Warning: You need ${studyHoursPerDay.toFixed(1)} hours/day but only have ${availableHours} available. Consider adjusting your target or freeing up more time.`
    } else if (studyHoursPerDay > 4) {
      warning = 'Studying more than 4 hours per day can lead to burnout. Consider spacing out your prep time if possible.'
    }

    setResult({
      daysUntilExam,
      totalStudyHours,
      studyHoursPerDay,
      recommendedSessions,
      studySchedule,
      warning
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <BookOpen className="mr-3 h-10 w-10 text-primary" />
          Study Time Calculator
        </h1>
        <p className="text-muted-foreground">
          Plan your study schedule and calculate time needed to reach your target score
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Plan Details</CardTitle>
            <CardDescription>Enter your exam and study information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examDate">Exam Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="examDate"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="available">Hours Available Per Day</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="available"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hoursAvailablePerDay}
                  onChange={(e) => setHoursAvailablePerDay(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Current Knowledge Level (%)</Label>
              <Input
                id="current"
                type="number"
                min="0"
                max="100"
                value={currentKnowledge}
                onChange={(e) => setCurrentKnowledge(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Estimate your current understanding (0-100%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Score (%)</Label>
              <Input
                id="target"
                type="number"
                min="0"
                max="100"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Subject Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="very-hard">Very Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculate Study Plan
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Study Plan</CardTitle>
                <CardDescription>Recommended study schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.warning && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                      {result.warning}
                    </p>
                  </div>
                )}

                {result.daysUntilExam > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Days Until Exam</p>
                        <p className="text-3xl font-bold text-primary">
                          {result.daysUntilExam}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                        <p className="text-3xl font-bold text-primary">
                          {result.totalStudyHours}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Hours Per Day</p>
                        <p className="text-2xl font-bold text-primary">
                          {result.studyHoursPerDay.toFixed(1)}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Study Sessions</p>
                        <p className="text-2xl font-bold text-primary">
                          {result.recommendedSessions}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">25-min each</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-semibold mb-3">Study Schedule:</p>
                      <div className="space-y-2">
                        {result.studySchedule.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Study Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Use Pomodoro Technique (25 min study, 5 min break)</p>
                <p>• Take a longer 15-30 min break every 2 hours</p>
                <p>• Study same time each day for consistency</p>
                <p>• Active recall {'>'}  passive reading</p>
                <p>• Practice tests are most effective</p>
                <p>• Teach concepts to others to solidify understanding</p>
                <p>• Get 7-8 hours of sleep, especially before exam</p>
                <p>• Review notes within 24 hours of learning</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

