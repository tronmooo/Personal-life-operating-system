import { Domain } from '@/types/domains'
import { DomainDetailPageClient } from './client-page'

export default async function DomainDetailPage({ params }: { params: Promise<{ domainId: string }> }) {
  const resolvedParams = await params
  const domainId = resolvedParams.domainId as Domain
  
  return <DomainDetailPageClient domainId={domainId} />
}
