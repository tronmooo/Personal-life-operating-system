'use client'

import { useEffect, useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Users, Calendar, Gift, MessageCircle, Star } from 'lucide-react'

interface RelationshipsCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

// Helper to calculate days until a date this year or next year
function getDaysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!month || !day) return null
    
    // Try this year first
    let targetDate = new Date(today.getFullYear(), month - 1, day)
    targetDate.setHours(0, 0, 0, 0)
    
    // If date has passed this year, use next year
    if (targetDate < today) {
      targetDate = new Date(today.getFullYear() + 1, month - 1, day)
    }
    
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (e) {
    return null
  }
}

export function RelationshipsCard({ size, data }: RelationshipsCardProps) {
  // Extract relationships array from data
  const relationships = useMemo(() => {
    return Array.isArray(data?.relationships) ? data.relationships : []
  }, [data?.relationships])

  // Calculate real statistics
  const stats = useMemo(() => {
    const totalContacts = relationships.length
    
    // Count by relationship type
    let familyCount = 0
    let friendsCount = 0
    let upcomingEventsCount = 0
    
    relationships.forEach((rel: any) => {
      const meta = rel?.metadata || {}
      const relationship = (meta.relationship || '').toLowerCase()
      
      // Count family
      if (relationship === 'family' || relationship.includes('family')) {
        familyCount++
      }
      
      // Count friends
      if (relationship === 'friend' || relationship === 'best_friend' || relationship.includes('friend')) {
        friendsCount++
      }
      
      // Count upcoming events (within 90 days)
      if (meta.birthday) {
        const days = getDaysUntil(meta.birthday)
        if (days !== null && days >= 0 && days <= 90) {
          upcomingEventsCount++
        }
      }
      
      if (meta.anniversaryDate) {
        const days = getDaysUntil(meta.anniversaryDate)
        if (days !== null && days >= 0 && days <= 90) {
          upcomingEventsCount++
        }
      }
      
      if (Array.isArray(meta.importantDates)) {
        meta.importantDates.forEach((impDate: any) => {
          if (impDate?.date) {
            const days = getDaysUntil(impDate.date)
            if (days !== null && days >= 0 && days <= 90) {
              upcomingEventsCount++
            }
          }
        })
      }
    })
    
    return {
      totalContacts,
      familyCount,
      friendsCount,
      upcomingEventsCount
    }
  }, [relationships])

  useEffect(() => {
    console.log('[RelationshipsCard] Real data calculated:', stats)
  }, [stats])

  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-200 dark:border-pink-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-pink-600" />
            <span className="font-semibold text-sm">Relationships</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">
              {stats.totalContacts}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Contacts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-200 dark:border-pink-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-pink-600" />
            Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Contacts</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {stats.totalContacts}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Family</span>
              </div>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {stats.familyCount}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Birthdays/Events</span>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {stats.upcomingEventsCount}
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Messages
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-200 dark:border-pink-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Relationships
          </div>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-pink-600">{stats.totalContacts}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.familyCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Family</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.friendsCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Friends</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-sm">Upcoming Events</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <span className="text-sm">🎂 Mom's Birthday</span>
              <span className="text-xs text-gray-500">Mar 15</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span className="text-sm">💍 Anniversary</span>
              <span className="text-xs text-gray-500">Apr 2</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span className="text-sm">🎉 Friend's Wedding</span>
              <span className="text-xs text-gray-500">May 20</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-sm">Gift Reminders</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>🎁 Get birthday gift for Mom (2 days)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>💝 Anniversary gift (18 days)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


























