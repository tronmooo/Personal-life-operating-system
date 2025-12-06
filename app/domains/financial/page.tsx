'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect old financial domain to new finance page
export default function FinancialDomainPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/finance')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to Finance...</p>
    </div>
  )
}



















