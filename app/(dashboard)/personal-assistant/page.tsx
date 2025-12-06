'use client'

import { useState } from 'react'
import { Phone, List, Plus, ArrowLeft, Mic, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function PersonalAssistantPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'create'>('tasks')
  const [taskInput, setTaskInput] = useState('')

  // Sample tasks for demo
  const sampleTasks = [
    { id: '1', title: 'Schedule dentist appointment', status: 'completed', date: '2024-12-05' },
    { id: '2', title: 'Call insurance company about claim', status: 'in_progress', date: '2024-12-06' },
    { id: '3', title: 'Book restaurant reservation', status: 'pending', date: '2024-12-07' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Phone className="h-8 w-8 text-blue-600" />
          Personal AI Assistant
        </h1>
        <p className="text-gray-500 mt-2">
          Your AI-powered calling assistant that makes phone calls on your behalf
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <List className="h-4 w-4" />
          My Tasks
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Plus className="h-4 w-4" />
          Create New
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Call Tasks</h2>
          
          {sampleTasks.length > 0 ? (
            <div className="grid gap-4">
              {sampleTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-500">{task.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No call tasks yet. Create one to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Create a New Call Task</h2>
            <p className="text-gray-500 mb-4">
              Describe what you need the AI to do. Be specific about who to call and what information you need.
            </p>
            
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Example: Call my dentist office at (555) 123-4567 and schedule a teeth cleaning appointment for next week. I prefer morning appointments."
              className="w-full h-32 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                <Mic className="h-5 w-5" />
                Create Task
              </button>
              <button
                onClick={() => setTaskInput('')}
                className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">Example Tasks</h3>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              <li>• "Call my insurance company and ask about claim status for case #12345"</li>
              <li>• "Make a dinner reservation for 4 people at Olive Garden on Saturday at 7pm"</li>
              <li>• "Schedule an oil change appointment at the Toyota dealership"</li>
              <li>• "Call the utility company to set up autopay for my account"</li>
            </ul>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-2">How It Works</h3>
        <p className="text-gray-500 text-sm mb-4">
          Your personal AI calling assistant automates phone calls
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Tell the AI what you need in natural language</li>
          <li>The AI plans the call and asks clarifying questions if needed</li>
          <li>Click "Start Call" when ready and the AI makes the phone call</li>
          <li>The AI handles the entire conversation professionally</li>
          <li>View the transcript and extracted data (prices, appointments, etc.)</li>
          <li>Get notified when tasks are complete or need your attention</li>
        </ol>
      </div>
    </div>
  )
}
