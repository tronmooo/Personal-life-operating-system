'use client'

/**
 * AI Tools & Calculators Dashboard
 * Comprehensive overview of all 85 AI-powered tools and calculators
 */

import { useState } from 'react'
import {
  Sparkles,
  Calculator,
  Search,
  TrendingUp,
  Activity,
  DollarSign,
  Home,
  Briefcase,
  Brain
} from 'lucide-react'
import Link from 'next/link'

export default function AIToolsCalculatorsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // 29 AI-Powered Tools
  const aiTools = [
    { name: 'AI Tax Prep Assistant', category: 'tax-financial', icon: '🧾', ai: true, link: '/tools' },
    { name: 'Smart Expense Tracker', category: 'tax-financial', icon: '💳', ai: true, link: '/tools' },
    { name: 'Receipt Scanner Pro', category: 'tax-financial', icon: '📸', ai: true, link: '/tools' },
    { name: 'AI Invoice Generator', category: 'tax-financial', icon: '📝', ai: true, link: '/tools' },
    { name: 'Smart Budget Creator', category: 'tax-financial', icon: '💰', ai: true, link: '/tools' },
    { name: 'Bill Pay Automation', category: 'tax-financial', icon: '🔔', ai: true, link: '/tools' },
    { name: 'Financial Report Generator', category: 'tax-financial', icon: '📊', ai: true, link: '/tools' },
    { name: 'Smart Form Filler', category: 'document', icon: '📋', ai: true, link: '/tools' },
    { name: 'Document Summarizer', category: 'document', icon: '📑', ai: true, link: '/tools' },
    { name: 'AI Data Entry Assistant', category: 'document', icon: '⌨️', ai: true, link: '/tools' },
    { name: 'Contract Reviewer', category: 'document', icon: '⚖️', ai: true, link: '/tools' },
    { name: 'Smart Document Organizer', category: 'document', icon: '🗂️', ai: true, link: '/tools' },
    { name: 'Smart Scheduler', category: 'planning', icon: '📅', ai: true, link: '/tools' },
    { name: 'Calendar Optimizer', category: 'planning', icon: '🗓️', ai: true, link: '/tools' },
    { name: 'AI Travel Planner', category: 'planning', icon: '✈️', ai: true, link: '/tools' },
    { name: 'AI Meal Planner', category: 'planning', icon: '🍽️', ai: true, link: '/tools' },
    { name: 'Task Prioritizer AI', category: 'planning', icon: '✅', ai: true, link: '/tools' },
    { name: 'AI Email Assistant', category: 'communication', icon: '📧', ai: true, link: '/tools' },
    { name: 'Customer Service Chatbot', category: 'communication', icon: '🤖', ai: true, link: '/tools' },
    { name: 'Meeting Notes AI', category: 'communication', icon: '📝', ai: true, link: '/tools' },
    { name: 'AI Translator Pro', category: 'communication', icon: '🌐', ai: true, link: '/tools' },
    { name: 'Service Comparator', category: 'research', icon: '🔎', ai: true, link: '/tools' },
    { name: 'Price Tracker AI', category: 'research', icon: '💲', ai: true, link: '/tools' },
    { name: 'Eligibility Checker', category: 'research', icon: '✔️', ai: true, link: '/tools' },
    { name: 'Deadline Tracker Pro', category: 'research', icon: '⏰', ai: true, link: '/tools' },
    { name: 'Smart Checklist Generator', category: 'admin', icon: '☑️', ai: true, link: '/tools' },
    { name: 'Renewal Reminder System', category: 'admin', icon: '🔄', ai: true, link: '/tools' },
    { name: 'Application Status Tracker', category: 'admin', icon: '📊', ai: true, link: '/tools' },
    { name: 'Document Template Generator', category: 'admin', icon: '📄', ai: true, link: '/tools' }
  ]

  // 56 Traditional Calculators
  const calculators = [
    { name: 'BMI Calculator', category: 'health', aiEnhanced: true },
    { name: 'Body Fat Calculator', category: 'health', aiEnhanced: true },
    { name: 'Calorie Calculator', category: 'health', aiEnhanced: true },
    { name: 'Macro Calculator', category: 'health', aiEnhanced: true },
    { name: 'Water Intake Calculator', category: 'health', aiEnhanced: true },
    { name: 'Heart Rate Zones', category: 'health', aiEnhanced: true },
    { name: 'Sleep Calculator', category: 'health', aiEnhanced: true },
    { name: 'Protein Intake Calculator', category: 'health', aiEnhanced: true },
    { name: 'Meal Planner', category: 'health', aiEnhanced: true },
    { name: 'Workout Planner', category: 'health', aiEnhanced: true },
    { name: 'VO2 Max Calculator', category: 'health', aiEnhanced: true },
    { name: 'Running Pace Calculator', category: 'health', aiEnhanced: true },
    { name: 'Body Age Calculator', category: 'health', aiEnhanced: true },
    { name: 'Ideal Weight Calculator', category: 'health', aiEnhanced: true },
    { name: 'Pregnancy Calculator', category: 'health', aiEnhanced: true },
    { name: 'Net Worth Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Budget Optimizer', category: 'financial', aiEnhanced: true },
    { name: 'Mortgage Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Loan Amortization', category: 'financial', aiEnhanced: true },
    { name: 'Compound Interest', category: 'financial', aiEnhanced: true },
    { name: 'Retirement Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Debt Payoff', category: 'financial', aiEnhanced: true },
    { name: 'Savings Goal', category: 'financial', aiEnhanced: true },
    { name: 'Emergency Fund', category: 'financial', aiEnhanced: true },
    { name: 'ROI Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Tax Estimator', category: 'financial', aiEnhanced: true },
    { name: 'Budget Planner', category: 'financial', aiEnhanced: true },
    { name: 'Home Affordability', category: 'financial', aiEnhanced: true },
    { name: 'Auto Loan Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Investment Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Salary Calculator', category: 'financial', aiEnhanced: true },
    { name: 'Tip Calculator', category: 'utility', aiEnhanced: false },
    { name: 'Unit Converter', category: 'utility', aiEnhanced: false },
    { name: 'Currency Converter', category: 'utility', aiEnhanced: false },
    { name: 'Time Zone Converter', category: 'utility', aiEnhanced: false },
    { name: 'Pomodoro Timer', category: 'utility', aiEnhanced: false },
    { name: 'Age Calculator', category: 'utility', aiEnhanced: false },
    { name: 'Date Difference Calculator', category: 'utility', aiEnhanced: false },
    { name: 'Password Generator', category: 'utility', aiEnhanced: false },
    { name: 'QR Code Generator', category: 'utility', aiEnhanced: false },
    { name: 'Color Picker', category: 'utility', aiEnhanced: false },
    { name: 'Markup Calculator', category: 'business', aiEnhanced: true },
    { name: 'Hourly Rate Calculator', category: 'business', aiEnhanced: true },
    { name: 'Project Cost Estimator', category: 'business', aiEnhanced: true },
    { name: 'Paycheck Calculator', category: 'business', aiEnhanced: true },
    { name: 'Break-Even Calculator', category: 'business', aiEnhanced: true },
    { name: 'Paint Calculator', category: 'property', aiEnhanced: true },
    { name: 'Tile Calculator', category: 'property', aiEnhanced: true },
    { name: 'Roofing Calculator', category: 'property', aiEnhanced: true },
    { name: 'Energy Cost Calculator', category: 'property', aiEnhanced: true },
    { name: 'Renovation Cost Estimator', category: 'property', aiEnhanced: true }
  ]

  const allTools = [
    ...aiTools.map(t => ({ ...t, type: 'AI Tool' })),
    ...calculators.map(c => ({ ...c, type: 'Calculator', icon: '🔢' }))
  ]

  const filteredTools = allTools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeTab === 'all' || 
     (activeTab === 'ai-tools' && 'ai' in tool) ||
     (activeTab === tool.category))
  )

  const stats = {
    total: aiTools.length + calculators.length,
    aiPowered: aiTools.length,
    aiEnhanced: calculators.filter(c => c.aiEnhanced).length,
    traditional: calculators.filter(c => !c.aiEnhanced).length
  }

  const tabs = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'ai-tools', label: `AI Tools (${stats.aiPowered})` },
    { id: 'health', label: 'Health' },
    { id: 'financial', label: 'Financial' },
    { id: 'business', label: 'Business' },
    { id: 'property', label: 'Property' },
    { id: 'utility', label: 'Utility' }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Brain className="w-10 h-10 text-purple-600" />
              AI Tools & Calculators
            </h1>
            <p className="text-gray-500 mt-2">
              {stats.total} powerful tools including {stats.aiPowered} AI-powered white-collar task automation tools
            </p>
          </div>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200">
            <Sparkles className="w-4 h-4 mr-2" />
            OpenAI Powered
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Tools</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 p-4">
            <p className="text-sm text-purple-700 dark:text-purple-300">AI-Powered Tools</p>
            <p className="text-3xl font-bold text-purple-600">{stats.aiPowered}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 p-4">
            <p className="text-sm text-green-700 dark:text-green-300">AI-Enhanced Calculators</p>
            <p className="text-3xl font-bold text-green-600">{stats.aiEnhanced}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow-sm">
            <p className="text-sm text-gray-500">Utility Tools</p>
            <p className="text-3xl font-bold">{stats.traditional}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tools and calculators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-4 text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool, index) => (
          <div
            key={index}
            className={`rounded-lg border p-4 hover:shadow-lg transition-shadow cursor-pointer ${
              'ai' in tool
                ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200'
                : 'bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tool.icon}</span>
                <h3 className="font-semibold">{tool.name}</h3>
              </div>
              {'ai' in tool && tool.ai && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI
                </span>
              )}
              {'aiEnhanced' in tool && tool.aiEnhanced && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  AI+
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500 border rounded px-2 py-1">{tool.type}</span>
              <Link
                href="/tools"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tools found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}
