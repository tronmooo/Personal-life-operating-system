import { PetDetailPageClient } from './client-page'

export default async function PetDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const resolvedParams = await params
  const petId = resolvedParams.petId
  
  return <PetDetailPageClient petId={petId} />
}
