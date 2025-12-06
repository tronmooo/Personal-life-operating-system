'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Newspaper, ExternalLink, Loader2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: {
    name: string
  }
  publishedAt: string
  urlToImage?: string
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours === 1) return '1 hour ago'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return '1 day ago'
  return `${diffInDays} days ago`
}

export function NewsCard() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        
        // NewsAPI.org - You'll need to add NEXT_PUBLIC_NEWS_API_KEY to env
        const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || 'demo'
        
        const response = await fetch(
          `https://newsapi.org/v2/top-headlines?country=us&category=general&pageSize=5&apiKey=${apiKey}`
        )

        if (!response.ok) {
          throw new Error('News API failed')
        }

        const data = await response.json()
        setNews(data.articles || [])
        setError(null)
      } catch (err) {
        console.error('News fetch error:', err)
        setError('Using demo data')
        
        // Mock data for demo
        setNews([
          {
            title: 'Breaking: Major Tech Innovation Announced',
            description: 'Industry leaders unveil groundbreaking technology that could reshape the future.',
            url: 'https://example.com/news1',
            source: { name: 'Tech News' },
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: 'Global Markets Show Strong Performance',
            description: 'Financial markets continue upward trend as investor confidence grows.',
            url: 'https://example.com/news2',
            source: { name: 'Financial Times' },
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: 'Scientific Breakthrough in Medical Research',
            description: 'Researchers discover new treatment method with promising results.',
            url: 'https://example.com/news3',
            source: { name: 'Science Daily' },
            publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: 'Environmental Initiative Gains Momentum',
            description: 'New sustainability program shows early success across multiple regions.',
            url: 'https://example.com/news4',
            source: { name: 'Green News' },
            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (loading) {
    return (
      <Card className="border-2 border-indigo-200 dark:border-indigo-900 hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-500" />
            <span className="text-lg">Breaking News</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-indigo-500" />
          <span className="text-lg">Breaking News</span>
          <Badge variant="secondary" className="ml-auto">
            <TrendingUp className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No news available</p>
        ) : (
          <div className="space-y-3">
            {news.slice(0, 4).map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {article.source.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getTimeAgo(article.publishedAt)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
        {error && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
            Demo mode - Add API keys for live data
          </p>
        )}
      </CardContent>
    </Card>
  )
}



