'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListChecks, Download, Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { useAITool } from '@/lib/hooks/use-ai-tool'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  category?: string
}

interface Checklist {
  title: string
  description: string
  items: ChecklistItem[]
}

export function ChecklistGenerator() {
  const [processType, setProcessType] = useState<string>('')
  const [customProcess, setCustomProcess] = useState<string>('')
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  
  const { loading, requestAI } = useAITool()

  const generateChecklist = async () => {
    const process = processType === 'custom' ? customProcess : processType
    if (!process) return

    const prompt = `Generate a comprehensive checklist for: ${process}

Create a detailed, actionable checklist with:
- 10-20 items
- Logical order (what to do first, second, etc.)
- Clear, specific action items
- Optional categories for grouping

Return JSON:
{
  "title": "...",
  "description": "Brief description of this process",
  "items": [
    {"text": "Action item", "category": "Optional category"},
    ...
  ]
}
`

    try {
      const result = await requestAI(prompt, {
        systemPrompt: 'You are a process expert. Create thorough, actionable checklists that help people complete complex tasks.',
        temperature: 0.6
      })

      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        const checklistData: Checklist = {
          title: data.title,
          description: data.description,
          items: data.items.map((item: any, index: number) => ({
            id: `item-${index}`,
            text: typeof item === 'string' ? item : item.text,
            completed: false,
            category: item.category
          }))
        }
        setChecklist(checklistData)
      }
    } catch (error) {
      console.error('Checklist generation failed:', error)
    }
  }

  const toggleItem = (id: string) => {
    if (!checklist) return
    setChecklist({
      ...checklist,
      items: checklist.items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    })
  }

  const addCustomItem = () => {
    if (!checklist) return
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: 'New item...',
      completed: false
    }
    setChecklist({
      ...checklist,
      items: [...checklist.items, newItem]
    })
  }

  const exportChecklist = () => {
    if (!checklist) return
    const text = `${checklist.title}\n${checklist.description}\n\n${checklist.items
      .map((item, i) => `${i + 1}. ${item.completed ? '✓' : '☐'} ${item.text}`)
      .join('\n')}`
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${checklist.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completedCount = checklist?.items.filter(i => i.completed).length || 0
  const totalCount = checklist?.items.length || 0
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-indigo-500" />
            Smart Checklist Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive checklists for any complex process with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Process Type</Label>
            <Select value={processType} onValueChange={setProcessType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a process or enter custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moving">Moving to New Home</SelectItem>
                <SelectItem value="wedding">Wedding Planning</SelectItem>
                <SelectItem value="job-search">Job Search</SelectItem>
                <SelectItem value="tax-prep">Tax Preparation</SelectItem>
                <SelectItem value="home-buying">Buying a Home</SelectItem>
                <SelectItem value="travel">International Travel</SelectItem>
                <SelectItem value="baby">Preparing for Baby</SelectItem>
                <SelectItem value="car-buying">Buying a Car</SelectItem>
                <SelectItem value="starting-business">Starting a Business</SelectItem>
                <SelectItem value="college-application">College Application</SelectItem>
                <SelectItem value="event-planning">Event Planning</SelectItem>
                <SelectItem value="custom">Custom Process</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {processType === 'custom' && (
            <div className="space-y-2">
              <Label>Describe Your Process</Label>
              <Input 
                placeholder="e.g. Planning a backyard renovation"
                value={customProcess}
                onChange={(e) => setCustomProcess(e.target.value)}
              />
            </div>
          )}

          <Button 
            onClick={generateChecklist} 
            disabled={loading || !processType || (processType === 'custom' && !customProcess)} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Checklist...
              </>
            ) : (
              <>
                <ListChecks className="mr-2 h-4 w-4" />
                Generate Checklist
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {checklist && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {checklist.title}
                <Button variant="outline" size="sm" onClick={exportChecklist}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardTitle>
              <CardDescription>{checklist.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{completedCount} / {totalCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {checklist.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(item.id)}
                      id={item.id}
                    />
                    <label
                      htmlFor={item.id}
                      className={`flex-1 text-sm cursor-pointer ${
                        item.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      <span className="font-semibold text-muted-foreground mr-2">
                        {index + 1}.
                      </span>
                      {item.text}
                      {item.category && (
                        <Badge variant="outline" className="ml-2">
                          {item.category}
                        </Badge>
                      )}
                    </label>
                    {item.completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addCustomItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Item
              </Button>
            </CardContent>
          </Card>

          {progress === 100 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  🎉 Checklist Complete!
                </h3>
                <p className="text-muted-foreground">
                  Great job! You've completed all {totalCount} items.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}






