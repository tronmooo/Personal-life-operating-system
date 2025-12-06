import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EnhancedDomainDetail } from '@/components/domains/enhanced-domain-detail'
import { INSURANCE_CATEGORIES } from '@/types/enhanced-domains'

export default function EnhancedInsurancePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/domains" className="hover:text-foreground flex items-center">
          <ChevronLeft className="h-4 w-4" />
          Domains
        </Link>
        <span>/</span>
        <Link href="/domains/insurance" className="hover:text-foreground">
          Insurance
        </Link>
        <span>/</span>
        <span className="text-foreground">Enhanced View</span>
      </div>

      <EnhancedDomainDetail
        domainId="insurance"
        domainName="Insurance Management"
        domainDescription="Comprehensive insurance coverage tracking with policies, claims, premiums, and coverage details"
        categories={INSURANCE_CATEGORIES}
      />
    </div>
  )
}








