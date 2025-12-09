'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Award, TrendingUp, Target, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface InsightCard {
  id: string
  type: 'score' | 'insight' | 'action' | 'celebration'
  title: string
  value?: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
  actionLabel?: string
  onAction?: () => void
}

interface MobileInsightsCarouselProps {
  insights: InsightCard[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function MobileInsightsCarousel({ 
  insights, 
  autoPlay = false, 
  autoPlayInterval = 5000 
}: MobileInsightsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto play
  useEffect(() => {
    if (!autoPlay || insights.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % insights.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, insights.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentIndex < insights.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }

    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(insights.length - 1, prev + 1))
  }

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'purple': return 'from-purple-500 to-purple-600'
      case 'blue': return 'from-blue-500 to-blue-600'
      case 'green': return 'from-green-500 to-green-600'
      case 'orange': return 'from-orange-500 to-orange-600'
      case 'red': return 'from-red-500 to-red-600'
      default: return 'from-purple-500 to-blue-600'
    }
  }

  const getTypeIcon = (type: InsightCard['type'], IconComponent?: React.ComponentType<{ className?: string }>) => {
    if (IconComponent) return <IconComponent className="h-8 w-8" />
    
    switch (type) {
      case 'score': return <Award className="h-8 w-8" />
      case 'insight': return <TrendingUp className="h-8 w-8" />
      case 'action': return <Target className="h-8 w-8" />
      case 'celebration': return <span className="text-4xl">🎉</span>
      default: return <Calendar className="h-8 w-8" />
    }
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>No insights available</p>
        </CardContent>
      </Card>
    )
  }

  const currentInsight = insights[currentIndex]

  return (
    <div className="space-y-4">
      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              className="w-full flex-shrink-0 px-2"
            >
              <Card className={`bg-gradient-to-br ${getColorClasses(insight.color)} text-white border-0`}>
                <CardContent className="p-8 space-y-4">
                  {/* Icon */}
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                      {getTypeIcon(insight.type, insight.icon)}
                    </div>
                  </div>

                  {/* Title & Badge */}
                  <div className="text-center space-y-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {insight.type}
                    </Badge>
                    <h3 className="text-2xl font-bold">{insight.title}</h3>
                  </div>

                  {/* Value */}
                  {insight.value && (
                    <div className="text-center">
                      <div className="text-5xl font-bold">{insight.value}</div>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-center text-white/90 text-lg">
                    {insight.description}
                  </p>

                  {/* Action Button */}
                  {insight.actionLabel && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="secondary"
                        onClick={insight.onAction}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        {insight.actionLabel}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Navigation Buttons (Desktop) */}
        <div className="hidden md:flex absolute inset-y-0 left-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="ml-2 bg-white/80 hover:bg-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="hidden md:flex absolute inset-y-0 right-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === insights.length - 1}
            className="mr-2 bg-white/80 hover:bg-white"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Indicators */}
      <div className="flex items-center justify-center gap-2">
        {insights.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              h-2 rounded-full transition-all
              ${index === currentIndex 
                ? 'w-8 bg-purple-600' 
                : 'w-2 bg-gray-300 dark:bg-gray-700'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Mobile Navigation */}
      <div className="flex md:hidden justify-center gap-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === insights.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}



