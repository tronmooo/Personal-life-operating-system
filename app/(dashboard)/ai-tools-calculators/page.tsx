'use client'

/**
 * AI Tools & Calculators Dashboard
 * Comprehensive overview of all 85 AI-powered tools and calculators
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  Calculator,
  Search,
  TrendingUp,
  Activity,
  DollarSign,
  Home,
  Briefcase,
  Wrench,
  Brain
} from 'lucide-react'
import Link from 'next/link'

export default function AIToolsCalculatorsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  // 29 AI-Powered Tools
  const aiTools = [
    // Tax & Financial (7)
    { name: 'AI Tax Prep Assistant', category: 'tax-financial', icon: '🧾', ai: true, link: '/tools' },
    { name: 'Smart Expense Tracker', category: 'tax-financial', icon: '💳', ai: true, link: '/tools' },
    { name: 'Receipt Scanner Pro', category: 'tax-financial', icon: '📸', ai: true, link: '/tools' },
    { name: 'AI Invoice Generator', category: 'tax-financial', icon: '📝', ai: true, link: '/tools' },
    { name: 'Smart Budget Creator', category: 'tax-financial', icon: '💰', ai: true, link: '/tools' },
    { name: 'Bill Pay Automation', category: 'tax-financial', icon: '🔔', ai: true, link: '/tools' },
    { name: 'Financial Report Generator', category: 'tax-financial', icon: '📊', ai: true, link: '/tools' },

    // Document Processing (5)
    { name: 'Smart Form Filler', category: 'document', icon: '📋', ai: true, link: '/tools' },
    { name: 'Document Summarizer', category: 'document', icon: '📑', ai: true, link: '/tools' },
    { name: 'AI Data Entry Assistant', category: 'document', icon: '⌨️', ai: true, link: '/tools' },
    { name: 'Contract Reviewer', category: 'document', icon: '⚖️', ai: true, link: '/tools' },
    { name: 'Smart Document Organizer', category: 'document', icon: '🗂️', ai: true, link: '/tools' },

    // Scheduling & Planning (5)
    { name: 'Smart Scheduler', category: 'planning', icon: '📅', ai: true, link: '/tools' },
    { name: 'Calendar Optimizer', category: 'planning', icon: '🗓️', ai: true, link: '/tools' },
    { name: 'AI Travel Planner', category: 'planning', icon: '✈️', ai: true, link: '/tools' },
    { name: 'AI Meal Planner', category: 'planning', icon: '🍽️', ai: true, link: '/tools' },
    { name: 'Task Prioritizer AI', category: 'planning', icon: '✅', ai: true, link: '/tools' },

    // Communication (4)
    { name: 'AI Email Assistant', category: 'communication', icon: '📧', ai: true, link: '/tools' },
    { name: 'Customer Service Chatbot', category: 'communication', icon: '🤖', ai: true, link: '/tools' },
    { name: 'Meeting Notes AI', category: 'communication', icon: '📝', ai: true, link: '/tools' },
    { name: 'AI Translator Pro', category: 'communication', icon: '🌐', ai: true, link: '/tools' },

    // Research & Analysis (4)
    { name: 'Service Comparator', category: 'research', icon: '🔎', ai: true, link: '/tools' },
    { name: 'Price Tracker AI', category: 'research', icon: '💲', ai: true, link: '/tools' },
    { name: 'Eligibility Checker', category: 'research', icon: '✔️', ai: true, link: '/tools' },
    { name: 'Deadline Tracker Pro', category: 'research', icon: '⏰', ai: true, link: '/tools' },

    // Administrative (4)
    { name: 'Smart Checklist Generator', category: 'admin', icon: '☑️', ai: true, link: '/tools' },
    { name: 'Renewal Reminder System', category: 'admin', icon: '🔄', ai: true, link: '/tools' },
    { name: 'Application Status Tracker', category: 'admin', icon: '📊', ai: true, link: '/tools' },
    { name: 'Document Template Generator', category: 'admin', icon: '📄', ai: true, link: '/tools' }
  ]

  // 56 Traditional Calculators (now AI-enhanced!)
  const calculators = [
    // Health & Fitness (15)
    { name: 'BMI Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Body Fat Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Calorie Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Macro Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Water Intake Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Heart Rate Zones', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Sleep Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Protein Intake Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Meal Planner', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Workout Planner', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'VO2 Max Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Running Pace Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Body Age Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Ideal Weight Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Pregnancy Calculator', category: 'health', icon: <Activity className="w-5 h-5" />, aiEnhanced: true },

    // Financial (16)
    { name: 'Net Worth Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Budget Optimizer', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Mortgage Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Loan Amortization', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Compound Interest', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Retirement Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Debt Payoff', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Savings Goal', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Emergency Fund', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'ROI Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Tax Estimator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Budget Planner', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Home Affordability', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Auto Loan Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Investment Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Salary Calculator', category: 'financial', icon: <DollarSign className="w-5 h-5" />, aiEnhanced: true },

    // Utility & Productivity (10)
    { name: 'Tip Calculator', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Unit Converter', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Currency Converter', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Time Zone Converter', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Pomodoro Timer', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Age Calculator', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Date Difference Calculator', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Password Generator', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'QR Code Generator', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },
    { name: 'Color Picker', category: 'utility', icon: <Calculator className="w-5 h-5" />, aiEnhanced: false },

    // Business & Career (5)
    { name: 'Markup Calculator', category: 'business', icon: <Briefcase className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Hourly Rate Calculator', category: 'business', icon: <Briefcase className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Project Cost Estimator', category: 'business', icon: <Briefcase className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Paycheck Calculator', category: 'business', icon: <Briefcase className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Break-Even Calculator', category: 'business', icon: <Briefcase className="w-5 h-5" />, aiEnhanced: true },

    // Home & Property (5)
    { name: 'Paint Calculator', category: 'property', icon: <Home className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Tile Calculator', category: 'property', icon: <Home className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Roofing Calculator', category: 'property', icon: <Home className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Energy Cost Calculator', category: 'property', icon: <Home className="w-5 h-5" />, aiEnhanced: true },
    { name: 'Renovation Cost Estimator', category: 'property', icon: <Home className="w-5 h-5" />, aiEnhanced: true }
  ]

  const allTools = [
    ...aiTools.map(t => ({ ...t, type: 'AI Tool' })),
    ...calculators.map(c => ({ ...c, type: 'Calculator' }))
  ]

  const filteredTools = allTools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: aiTools.length + calculators.length,
    aiPowered: aiTools.length,
    aiEnhanced: calculators.filter(c => c.aiEnhanced).length,
    traditional: calculators.filter(c => !c.aiEnhanced).length
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Brain className="w-10 h-10 text-purple-600" />
              AI Tools & Calculators
            </h1>
            <p className="text-muted-foreground mt-2">
              {stats.total} powerful tools including {stats.aiPowered} AI-powered white-collar task automation tools
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            OpenAI Powered
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700">AI-Powered Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.aiPowered}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">AI-Enhanced Calculators</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.aiEnhanced}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Utility Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.traditional}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search tools and calculators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools ({stats.aiPowered})</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="utility">Utility</TabsTrigger>
        </TabsList>

        {/* All Tools */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {typeof tool.icon === 'string' ? (
                        <span className="text-2xl">{tool.icon}</span>
                      ) : (
                        tool.icon
                      )}
                      {tool.name}
                    </span>
                    {'ai' in tool && tool.ai && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {'aiEnhanced' in tool && tool.aiEnhanced && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        AI+
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{tool.type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="ai-tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>29 AI-Powered White-Collar Task Automation Tools</CardTitle>
              <CardDescription>
                Advanced AI tools using OpenAI GPT-4 and Gemini for document processing, financial analysis, scheduling, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiTools.map((tool, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md flex items-center gap-2">
                        <span className="text-2xl">{tool.icon}</span>
                        {tool.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href={tool.link}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Open Tool
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health & Fitness Calculators</CardTitle>
              <CardDescription>
                15 calculators with AI-powered personalized insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculators.filter(c => c.category === 'health').map((calc, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {calc.icon}
                          {calc.name}
                        </span>
                        {calc.aiEnhanced && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            AI+
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tools">
                        <Button variant="outline" size="sm" className="w-full">
                          Calculate
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Calculators</CardTitle>
              <CardDescription>
                16 calculators with AI-powered financial insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculators.filter(c => c.category === 'financial').map((calc, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {calc.icon}
                          {calc.name}
                        </span>
                        {calc.aiEnhanced && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            AI+
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tools">
                        <Button variant="outline" size="sm" className="w-full">
                          Calculate
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business & Career Calculators</CardTitle>
              <CardDescription>
                5 calculators with AI business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculators.filter(c => c.category === 'business').map((calc, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {calc.icon}
                          {calc.name}
                        </span>
                        {calc.aiEnhanced && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            AI+
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tools">
                        <Button variant="outline" size="sm" className="w-full">
                          Calculate
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Tab */}
        <TabsContent value="property">
          <Card>
            <CardHeader>
              <CardTitle>Home & Property Calculators</CardTitle>
              <CardDescription>
                5 calculators with AI home improvement insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculators.filter(c => c.category === 'property').map((calc, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {calc.icon}
                          {calc.name}
                        </span>
                        {calc.aiEnhanced && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            AI+
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tools">
                        <Button variant="outline" size="sm" className="w-full">
                          Calculate
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utility Tab */}
        <TabsContent value="utility">
          <Card>
            <CardHeader>
              <CardTitle>Utility & Productivity Tools</CardTitle>
              <CardDescription>
                10 essential utility tools for everyday use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculators.filter(c => c.category === 'utility').map((calc, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md flex items-center gap-2">
                        {calc.icon}
                        {calc.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/tools">
                        <Button variant="outline" size="sm" className="w-full">
                          Open Tool
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

