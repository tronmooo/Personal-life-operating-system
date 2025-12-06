import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EnhancedDomainDetail } from '@/components/domains/enhanced-domain-detail'
import { VEHICLES_CATEGORIES } from '@/types/enhanced-domains'

export default function EnhancedVehiclesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/domains" className="hover:text-foreground flex items-center">
          <ChevronLeft className="h-4 w-4" />
          Domains
        </Link>
        <span>/</span>
        <Link href="/domains/vehicles" className="hover:text-foreground">
          Vehicles
        </Link>
        <span>/</span>
        <span className="text-foreground">Enhanced View</span>
      </div>

      <EnhancedDomainDetail
        domainId="vehicles"
        domainName="Vehicle Management"
        domainDescription="Complete vehicle ownership tracking with maintenance logs, fuel efficiency, and registration renewals"
        categories={VEHICLES_CATEGORIES}
      />
    </div>
  )
}








