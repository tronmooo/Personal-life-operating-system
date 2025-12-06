'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, CheckCircle, ArrowRight, ArrowLeft, 
  Heart, Briefcase, Home, DollarSign, BookOpen, Plane,
  Users, Car, Shield, Trophy, PawPrint, MessageSquare
} from 'lucide-react'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'

const DOMAIN_OPTIONS = [
  { id: 'financial', label: 'Financial', icon: DollarSign, color: 'text-green-600', description: 'Budgets, bills, investments' },
  { id: 'health', label: 'Health & Fitness', icon: Heart, color: 'text-red-600', description: 'Workouts, nutrition, wellness' },
  { id: 'career', label: 'Career', icon: Briefcase, color: 'text-blue-600', description: 'Goals, skills, networking' },
  { id: 'home', label: 'Home & Living', icon: Home, color: 'text-orange-600', description: 'Maintenance, chores, projects' },
  { id: 'education', label: 'Education', icon: BookOpen, color: 'text-purple-600', description: 'Courses, learning, skills' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'text-cyan-600', description: 'Trips, itineraries, bookings' },
  { id: 'social', label: 'Social', icon: Users, color: 'text-pink-600', description: 'Friends, events, relationships' },
  { id: 'vehicles', label: 'Vehicles', icon: Car, color: 'text-gray-600', description: 'Maintenance, insurance, logs' },
  { id: 'insurance', label: 'Insurance', icon: Shield, color: 'text-indigo-600', description: 'Policies, claims, coverage' },
  { id: 'goals', label: 'Goals & Dreams', icon: Trophy, color: 'text-yellow-600', description: 'Aspirations, milestones' },
  { id: 'pets', label: 'Pets', icon: PawPrint, color: 'text-amber-600', description: 'Pet care, vet visits, supplies' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, color: 'text-teal-600', description: 'Messages, contacts' },
]

const STEPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to LifeHub!',
    subtitle: 'Your all-in-one life management platform',
  },
  {
    id: 'domains',
    title: '📋 Choose Your Domains',
    subtitle: 'Select the areas of life you want to track',
  },
  {
    id: 'preferences',
    title: '⚙️ Set Preferences',
    subtitle: 'Customize your experience',
  },
  {
    id: 'complete',
    title: '🎉 All Set!',
    subtitle: "You're ready to start organizing your life",
  },
]

interface WelcomeWizardProps {
  onComplete?: (selectedDomains: string[], preferences: any) => void
}

export function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  // Check if user has already completed onboarding
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true) // Changed to true by default
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'financial', 'health', 'career' // Pre-select popular ones
  ])
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    sampleData: true,
    aiAssistant: true,
  })
  const [isOpen, setIsOpen] = useState(false)

  // Load onboarding status from Supabase settings
  import('react').then(async () => {
    try {
      const settings = await getUserSettings()
      const completed = settings?.onboarding?.completed
      setIsOpen(!completed)
    } catch {
      setIsOpen(true)
    }
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      updateUserSettings({
        onboarding: { completed: true, selectedDomains, preferences }
      }).catch(() => {})
      
      // Load sample data if requested
      if (preferences.sampleData) {
        loadSampleData(selectedDomains)
      }
      
      if (onComplete) {
        onComplete(selectedDomains, preferences)
      }
      setIsOpen(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleDomain = (domainId: string) => {
    if (selectedDomains.includes(domainId)) {
      setSelectedDomains(selectedDomains.filter(id => id !== domainId))
    } else {
      setSelectedDomains([...selectedDomains, domainId])
    }
  }

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome to LifeHub!</h2>
              <p className="text-muted-foreground text-lg">
                Organize every aspect of your life in one beautiful platform
              </p>
            </div>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Track 21 Life Domains</div>
                  <p className="text-sm text-muted-foreground">From finances to fitness, we've got you covered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">AI-Powered Insights</div>
                  <p className="text-sm text-muted-foreground">Get smart suggestions and automated tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Secure & Private</div>
                  <p className="text-sm text-muted-foreground">Your data is encrypted and belongs to you</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'domains':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Select Your Focus Areas</h3>
              <p className="text-muted-foreground">Choose at least 3 domains to get started</p>
              <Badge variant="secondary" className="mt-2">
                {selectedDomains.length} selected
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {DOMAIN_OPTIONS.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => toggleDomain(domain.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedDomains.includes(domain.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <domain.icon className={`h-5 w-5 ${domain.color}`} />
                    <span className="font-medium text-sm">{domain.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{domain.description}</p>
                  {selectedDomains.includes(domain.id) && (
                    <CheckCircle className="h-4 w-4 text-primary mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Customize Your Experience</h3>
              <p className="text-muted-foreground">You can change these anytime in settings</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">Enable Notifications</div>
                  <p className="text-sm text-muted-foreground">Get reminders for bills, tasks, and events</p>
                </div>
                <Checkbox
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, notifications: !!checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">Load Sample Data</div>
                  <p className="text-sm text-muted-foreground">See examples to understand how it works</p>
                </div>
                <Checkbox
                  checked={preferences.sampleData}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, sampleData: !!checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">AI Assistant</div>
                  <p className="text-sm text-muted-foreground">Get smart suggestions and insights</p>
                </div>
                <Checkbox
                  checked={preferences.aiAssistant}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, aiAssistant: !!checked })
                  }
                />
              </div>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">You're All Set! 🎉</h2>
              <p className="text-muted-foreground text-lg">
                Your personalized LifeHub is ready
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="font-medium">What's next?</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Explore your {selectedDomains.length} selected domains</li>
                {preferences.sampleData && <li>✓ Check out the sample data we've added</li>}
                {preferences.aiAssistant && <li>✓ Try the AI Assistant for smart suggestions</li>}
                <li>✓ Use the Quick Add button (bottom right) to start tracking</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={currentStep === 1 && selectedDomains.length < 3}
            className={currentStep === 0 ? 'w-full' : 'flex-1'}
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                Get Started
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Load sample data for selected domains
function loadSampleData(domains: string[]) {
  const sampleTasks = [
    { domain: 'financial', title: 'Review monthly budget', priority: 'high' },
    { domain: 'health', title: 'Morning workout', priority: 'medium' },
    { domain: 'career', title: 'Update resume', priority: 'medium' },
  ]

  const sampleBills = [
    { name: 'Rent', amount: 1500, dueDate: '2024-02-01', domain: 'financial' },
    { name: 'Internet', amount: 80, dueDate: '2024-02-15', domain: 'home' },
  ]

  // Add sample data to Supabase instead of localStorage
  import('@supabase/auth-helpers-nextjs').then(async ({ createClientComponentClient }) => {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert tasks
    const insertTasks = sampleTasks
      .filter(t => domains.includes(t.domain))
      .map(t => ({
        user_id: user.id,
        title: t.title,
        completed: false,
        priority: (t as any).priority || 'medium',
        due_date: null,
        category: t.domain,
      }))

    if (insertTasks.length > 0) {
      await supabase.from('tasks').insert(insertTasks)
    }

    // Insert bills if financial selected
    if (domains.includes('financial')) {
      const insertBills = sampleBills.map(b => ({
        user_id: user.id,
        name: b.name,
        amount: b.amount,
        due_date: b.dueDate,
        category: 'financial',
        paid: false,
        recurring: false,
      }))
      await supabase.from('bills').insert(insertBills)
    }
  })
}

