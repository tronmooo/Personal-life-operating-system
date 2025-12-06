'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from './button'

export function BackButton({ label = 'Back', className }: { label?: string; className?: string }) {
  const router = useRouter()
  return (
    <Button variant="outline" size="sm" onClick={() => router.back()} className={className}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}








