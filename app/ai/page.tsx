'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Sparkles, Brain, MessageSquare, Zap, Target, TrendingUp, Settings } from 'lucide-react'
import Link from 'next/link'

export default function AIPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-purple-500" />
          AI Features
        </h1>
        <p className="text-lg text-muted-foreground">
          Intelligent tools powered by AI to help manage your life better
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI Settings */}
        <Link href="/ai-assistant-settings">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle>AI Settings</CardTitle>
              <CardDescription>
                Customize your AI assistant's behavior, voice, and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Configure AI
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* AI Assistant */}
        <Link href="/insights">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Get intelligent insights and recommendations based on your life data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Open AI Assistant
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* AI Concierge */}
        <Link href="/concierge">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>AI Concierge</CardTitle>
              <CardDescription>
                Voice-enabled AI assistant for making calls and managing tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Open AI Concierge
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Smart Insights */}
        <Link href="/insights">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Smart Insights</CardTitle>
              <CardDescription>
                AI-powered analysis of your habits, spending, and health trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Insights
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Chat with AI */}
        <Link href="/ai-chat">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Chat with AI</CardTitle>
              <CardDescription>
                Have a conversation with AI to get help managing your life
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* AI Goals Coach */}
        <Card className="hover:shadow-lg transition-all h-full">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <CardTitle>AI Goals Coach</CardTitle>
            <CardDescription>
              Let AI help you set, track, and achieve your personal goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Get Coaching
            </Button>
          </CardContent>
        </Card>

        {/* Predictive Analytics */}
        <Card className="hover:shadow-lg transition-all h-full">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle>Predictive Analytics</CardTitle>
            <CardDescription>
              AI predictions for expenses, habits, and life patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              View Predictions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>What AI Can Do For You</CardTitle>
          <CardDescription>Powered by advanced machine learning and natural language processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized suggestions based on your data and goals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h3 className="font-semibold">Pattern Recognition</h3>
                <p className="text-sm text-muted-foreground">
                  Identify trends in your spending, health, and daily habits
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold">Natural Language</h3>
                <p className="text-sm text-muted-foreground">
                  Talk to AI naturally - ask questions, get answers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="font-semibold">Goal Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  AI monitors progress and suggests actions to reach your goals
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}








