import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EnhancedDomainDetail } from '@/components/domains/enhanced-domain-detail'
import { FINANCIAL_CATEGORIES } from '@/types/enhanced-domains'

export default function EnhancedFinancialPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/domains" className="hover:text-foreground flex items-center">
          <ChevronLeft className="h-4 w-4" />
          Domains
        </Link>
        <span>/</span>
        <Link href="/domains/financial" className="hover:text-foreground">
          Financial
        </Link>
        <span>/</span>
        <span className="text-foreground">Enhanced View</span>
      </div>

      <EnhancedDomainDetail
        domainId="financial"
        domainName="Financial Management"
        domainDescription="Complete financial health monitoring and wealth management across accounts, investments, bills, and goals"
        categories={FINANCIAL_CATEGORIES}
      />
    </div>
  )
}








