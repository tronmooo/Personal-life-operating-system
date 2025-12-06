'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Globe, Clock } from 'lucide-react'

const timeZones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 0 },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { value: 'America/Anchorage', label: 'Alaska Time', offset: -9 },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', offset: -10 },
  { value: 'Europe/London', label: 'London (GMT)', offset: 0 },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 1 },
  { value: 'Europe/Athens', label: 'Athens (EET)', offset: 2 },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 4 },
  { value: 'Asia/Kolkata', label: 'India', offset: 5.5 },
  { value: 'Asia/Shanghai', label: 'China', offset: 8 },
  { value: 'Asia/Tokyo', label: 'Japan', offset: 9 },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 11 },
  { value: 'Pacific/Auckland', label: 'New Zealand', offset: 13 },
]

export function TimeZoneConverter() {
  const [sourceTime, setSourceTime] = useState('')
  const [sourceZone, setSourceZone] = useState('America/New_York')
  const [targetZone, setTargetZone] = useState('Europe/London')
  const [convertedTime, setConvertedTime] = useState('')

  const convertTime = () => {
    if (!sourceTime) return

    try {
      // Create a date object from the input time
      const [hours, minutes] = sourceTime.split(':').map(Number)
      const sourceDate = new Date()
      sourceDate.setHours(hours, minutes, 0, 0)

      // Get offset differences
      const sourceOffset = timeZones.find((tz) => tz.value === sourceZone)?.offset || 0
      const targetOffset = timeZones.find((tz) => tz.value === targetZone)?.offset || 0

      // Calculate the time difference
      const diffHours = targetOffset - sourceOffset
      
      // Apply the difference
      const targetDate = new Date(sourceDate)
      targetDate.setHours(targetDate.getHours() + diffHours)

      // Format the result
      const formatted = targetDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })

      setConvertedTime(formatted)
    } catch (error) {
      setConvertedTime('Invalid time')
    }
  }

  const getCurrentTimeInZone = (timezone: string) => {
    const now = new Date()
    const offset = timeZones.find((tz) => tz.value === timezone)?.offset || 0
    const localOffset = now.getTimezoneOffset() / 60
    const zoneTime = new Date(now.getTime() + (offset + localOffset) * 3600000)
    
    return zoneTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-500" />
            Time Zone Converter
          </CardTitle>
          <CardDescription>
            Convert times between different time zones for meetings and travel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceTime">Time</Label>
              <Input
                id="sourceTime"
                type="time"
                value={sourceTime}
                onChange={(e) => setSourceTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceZone">From Time Zone</Label>
              <select
                id="sourceZone"
                value={sourceZone}
                onChange={(e) => setSourceZone(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {timeZones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Current time: {getCurrentTimeInZone(sourceZone)}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="targetZone">To Time Zone</Label>
              <select
                id="targetZone"
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {timeZones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Current time: {getCurrentTimeInZone(targetZone)}
              </p>
            </div>
          </div>

          <Button onClick={convertTime} className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            Convert Time
          </Button>

          {convertedTime && (
            <div className="p-6 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Converted Time</p>
              <p className="text-4xl font-bold text-primary">{convertedTime}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {timeZones.find((tz) => tz.value === targetZone)?.label}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* World Clock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">World Clock</CardTitle>
          <CardDescription>Current time in major cities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {timeZones.slice(0, 12).map((tz) => (
              <div key={tz.value} className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">{tz.label.split('(')[0].trim()}</p>
                <p className="text-lg font-bold">{getCurrentTimeInZone(tz.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">Time Zone Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Scheduling meetings:</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
              <li>Use tools like this to find overlapping work hours</li>
              <li>Consider time zones when sending emails</li>
              <li>Add time zone context in calendar invites</li>
              <li>Be aware of daylight saving time changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







