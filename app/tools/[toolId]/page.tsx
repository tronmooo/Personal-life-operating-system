import { ToolPageClient } from './client-page'

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const resolvedParams = await params
  const toolId = resolvedParams.toolId
  
  return <ToolPageClient toolId={toolId} />
}
