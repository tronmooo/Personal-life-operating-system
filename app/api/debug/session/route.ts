import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/auth-options'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  console.log('🔍 DEBUG SESSION:', JSON.stringify(session, null, 2))
  
  return NextResponse.json({
    authenticated: !!session,
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
    fullSession: session
  })
}

