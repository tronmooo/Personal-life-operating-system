'use client'

import { Newspaper, ExternalLink, Loader2, TrendingUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CollapsibleDashboardCard } from './collapsible-dashboard-card'

interface HNStory {
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number
  descendants: number
}

const getTimeAgo = (timestamp: number) => {
  const now = Date.now() / 1000
  const diffInHours = Math.floor((now - timestamp) / 3600)
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours === 1) return '1 hour ago'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return '1 day ago'
  return `${diffInDays} days ago`
}

export function NewsFreeCard() {
  const [stories, setStories] = useState<HNStory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllStories, setShowAllStories] = useState(false)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        
        // Hacker News API - Completely FREE, no API key needed!
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
        const storyIds = await response.json()
        
        // Get top 10 stories (show more when expanded)
        const topStoryIds = storyIds.slice(0, 10)
        const storyPromises = topStoryIds.map((id: number) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
        )
        
        const fetchedStories = await Promise.all(storyPromises)
        setStories(fetchedStories)
      } catch (err) {
        console.error('News fetch error:', err)
        // Fallback to empty for now
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  // Show limited stories when collapsed, all when expanded
  const displayStories = showAllStories ? stories : stories.slice(0, 4)

  if (loading) {
    return (
      <CollapsibleDashboardCard
        id="tech-news"
        title="Tech News"
        icon={<Newspaper className="w-5 h-5 text-orange-500" />}
        badge={
          <Badge variant="secondary" className="ml-auto">
            <TrendingUp className="w-3 h-3 mr-1" />
            Top Stories
          </Badge>
        }
        borderColor="border-orange-200 dark:border-orange-900"
        defaultOpen={true}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      </CollapsibleDashboardCard>
    )
  }

  return (
    <CollapsibleDashboardCard
      id="tech-news"
      title="Tech News"
      icon={<Newspaper className="w-5 h-5 text-orange-500" />}
      badge={
        <Badge variant="secondary">
          <TrendingUp className="w-3 h-3 mr-1" />
          Top Stories
        </Badge>
      }
      borderColor="border-orange-200 dark:border-orange-900"
      defaultOpen={true}
    >
      {stories.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No stories available</p>
      ) : (
        <div className="space-y-3">
          {displayStories.map((story) => (
            <a
              key={story.id}
              href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {story.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>{story.score} pts</span>
                    </div>
                    {story.descendants > 0 && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <MessageSquare className="w-3 h-3" />
                          <span>{story.descendants}</span>
                        </div>
                      </>
                    )}
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(story.time)}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
          
          {/* Show More/Less Button */}
          {stories.length > 4 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
              onClick={(e) => {
                e.preventDefault()
                setShowAllStories(!showAllStories)
              }}
            >
              {showAllStories ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show All {stories.length} Stories
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <div className="text-xs text-center text-gray-500 mt-3">
        Powered by Hacker News (Free!)
      </div>
    </CollapsibleDashboardCard>
  )
}
