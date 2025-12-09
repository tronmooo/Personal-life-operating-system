import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


/**
 * Test endpoint to verify upload functionality without OpenAI
 * curl -X POST http://localhost:3009/api/documents/test-upload -F "file=@test.jpg"
 */
export async function POST(request: NextRequest) {
  try {
    console.log('✅ Test upload endpoint reached')
    
    // Auth check
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (!session?.user?.id) {
      console.log('❌ No session found')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No active session' 
      }, { status: 401 })
    }

    console.log('✅ Auth check passed:', user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ No file in request')
      return NextResponse.json({ 
        error: 'No file provided',
        details: 'FormData did not contain a file' 
      }, { status: 400 })
    }

    console.log('✅ File received:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    })

    // Check OpenAI API key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    console.log('OpenAI API Key configured:', hasOpenAIKey)
    
    if (hasOpenAIKey) {
      console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10))
    }

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working!',
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userEmail: user.email,
        openAIConfigured: hasOpenAIKey
      }
    })

  } catch (error: any) {
    console.error('❌ Test upload error:', error)
    return NextResponse.json({ 
      error: error.message || 'Test failed',
      stack: error.stack,
      success: false 
    }, { status: 500 })
  }
}









