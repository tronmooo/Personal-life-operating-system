'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Newspaper, ExternalLink, Loader2, TrendingUp, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        
        // Hacker News API - Completely FREE, no API key needed!
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
        const storyIds = await response.json()
        
        // Get top 5 stories
        const topStoryIds = storyIds.slice(0, 5)
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

  if (loading) {
    return (
      <Card className="border-2 border-orange-200 dark:border-orange-900 hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-orange-500" />
            <span className="text-lg">Tech News</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-orange-500" />
          <span className="text-lg">Tech News</span>
          <Badge variant="secondary" className="ml-auto">
            <TrendingUp className="w-3 h-3 mr-1" />
            Top Stories
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stories.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No stories available</p>
        ) : (
          <div className="space-y-3">
            {stories.slice(0, 4).map((story, idx) => (
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
          </div>
        )}
        <div className="text-xs text-center text-gray-500 mt-3">
          Powered by Hacker News (Free!)
        </div>
      </CardContent>
    </Card>
  )
}



