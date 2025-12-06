"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { normalizeMetadata } from '@/lib/utils/normalize-metadata'
import { computeWeeklySleepAvg } from '@/lib/selectors/health'

export function SleepTab() {
  const { getData, addData, reloadDomain } = useData()
  const healthData = getData('health') || []

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState<string>('8')
  const [minutes, setMinutes] = useState<string>('0')
  const [quality, setQuality] = useState<string>('3')

  const handleAdd = async () => {
    const h = parseInt(hours || '0', 10)
    const m = parseInt(minutes || '0', 10)
    const total = Math.max(0, h * 60 + m)
    const q = Math.min(5, Math.max(1, parseInt(quality || '3', 10)))

    await addData('health', {
      title: `Sleep ${h}h ${m}m`,
      description: `Sleep for ${date}`,
      metadata: { type: 'sleep', date, durationMinutes: total, quality: q }
    })
    try { await reloadDomain('health' as any) } catch {}
  }

  const sleepList = (healthData as any[])
    .filter((item) => (normalizeMetadata(item).type || '').toLowerCase() === 'sleep')
    .map((item) => {
      const m = normalizeMetadata(item) as any
      return { id: item.id, date: (m.date as string) || item.createdAt.split('T')[0], minutes: parseInt(String(m.durationMinutes || 0), 10) || 0, quality: parseInt(String(m.quality || 0), 10) || 0 }
    })
    .sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())

  const weeklyAvg = useMemo(() => computeWeeklySleepAvg(healthData), [healthData])

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Weekly Average</h3>
            <div className="text-2xl font-bold">{weeklyAvg.label}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Hours</Label>
              <Input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div>
              <Label>Minutes</Label>
              <Input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
            <div>
              <Label>Quality (1-5)</Label>
              <Input type="number" min="1" max="5" value={quality} onChange={(e) => setQuality(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">Log Sleep</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          {sleepList.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sleep logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DATE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DURATION</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">QUALITY</th>
                  </tr>
                </thead>
                <tbody>
                  {sleepList.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">{s.date}</td>
                      <td className="p-3">{`${Math.floor(s.minutes / 60)}h ${s.minutes % 60}m`}</td>
                      <td className="p-3">{s.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}










