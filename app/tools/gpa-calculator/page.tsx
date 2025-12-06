'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'

interface Course {
  id: number
  name: string
  grade: string
  credits: number
}

const gradePoints: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
}

export default function GPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: '', grade: 'A', credits: 3 }
  ])
  const [gpa, setGPA] = useState<number | null>(null)

  const addCourse = () => {
    setCourses([...courses, {
      id: Date.now(),
      name: '',
      grade: 'A',
      credits: 3
    }])
  }

  const removeCourse = (id: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id))
    }
  }

  const updateCourse = (id: number, field: keyof Course, value: any) => {
    setCourses(courses.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const calculateGPA = () => {
    let totalPoints = 0
    let totalCredits = 0

    courses.forEach(course => {
      const points = gradePoints[course.grade] || 0
      totalPoints += points * course.credits
      totalCredits += course.credits
    })

    const calculatedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0
    setGPA(calculatedGPA)
  }

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.7) return 'text-green-600'
    if (gpa >= 3.0) return 'text-blue-600'
    if (gpa >= 2.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGPALabel = (gpa: number) => {
    if (gpa >= 3.7) return 'Excellent'
    if (gpa >= 3.0) return 'Good'
    if (gpa >= 2.0) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <GraduationCap className="mr-3 h-10 w-10 text-primary" />
          GPA Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate your Grade Point Average (GPA) based on courses and grades
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Add your courses, grades, and credit hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.map((course, index) => (
                <div key={course.id} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`course-${course.id}`}>Course {index + 1}</Label>
                    <Input
                      id={`course-${course.id}`}
                      placeholder="Course name (optional)"
                      value={course.name}
                      onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                    />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Grade</Label>
                    <Select
                      value={course.grade}
                      onValueChange={(value) => updateCourse(course.id, 'grade', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(gradePoints).map(grade => (
                          <SelectItem key={grade} value={grade}>
                            {grade} ({gradePoints[grade]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-24 space-y-2">
                    <Label>Credits</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={course.credits}
                      onChange={(e) => updateCourse(course.id, 'credits', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeCourse(course.id)}
                    disabled={courses.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addCourse}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>

              <Button onClick={calculateGPA} className="w-full">
                Calculate GPA
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          {gpa !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Your GPA</CardTitle>
                <CardDescription>Current grade point average</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <p className={`text-6xl font-bold ${getGPAColor(gpa)}`}>
                    {gpa.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getGPALabel(gpa)}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Credits:</span>
                    <span className="font-medium">
                      {courses.reduce((sum, c) => sum + c.credits, 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Courses:</span>
                    <span className="font-medium">{courses.length}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    <strong>Scale:</strong> 4.0 GPA scale
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">GPA Scale</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>A (4.0)</span>
                <span className="text-green-600">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span>B (3.0)</span>
                <span className="text-blue-600">Good</span>
              </div>
              <div className="flex justify-between">
                <span>C (2.0)</span>
                <span className="text-yellow-600">Fair</span>
              </div>
              <div className="flex justify-between">
                <span>D (1.0)</span>
                <span className="text-orange-600">Poor</span>
              </div>
              <div className="flex justify-between">
                <span>F (0.0)</span>
                <span className="text-red-600">Fail</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}






