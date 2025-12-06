import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AI_ADVISORS } from '@/types/ai'
import { Brain, MessageSquare, Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AIInsightsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground mt-2">
          Get personalized insights and recommendations from 12 specialized AI advisors
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Brain className="h-4 w-4 mr-2" />
              AI Advisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Specialized advisors available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Messages exchanged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Sparkles className="h-4 w-4 mr-2" />
              Insights Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Personalized insights</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Advisors Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your AI Advisors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.values(AI_ADVISORS).map((advisor) => (
            <Card key={advisor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`h-10 w-10 rounded-lg ${advisor.color} flex items-center justify-center`}>
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{advisor.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-4">
                  {advisor.description}
                </CardDescription>
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Automated Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Insights</CardTitle>
          <CardDescription>AI-generated insights based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start adding data to your domains to receive personalized AI insights
            </p>
            <Button asChild>
              <Link href="/domains">
                Add Data
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-medium">Daily Insights Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Receive automated daily insights about your life domains
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-medium">Weekly & Monthly Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive summaries of your progress and trends
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-medium">Pattern Recognition</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered pattern detection across your life domains
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div>
                <h3 className="font-medium">Cross-Domain Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Discover connections and correlations between different life areas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


