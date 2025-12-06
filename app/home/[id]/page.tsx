import { HomeDetailPageClient } from './client-page'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HomeDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const homeId = resolvedParams.id
  
  return <HomeDetailPageClient homeId={homeId} />
}
