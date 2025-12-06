import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SendEmailRequest, SendEmailResponse } from '@/types/share'

/**
 * POST /api/share/email
 * Send share link via email
 * 
 * Note: This is a placeholder implementation. In production, integrate with:
 * - Resend (resend.com)
 * - SendGrid
 * - AWS SES
 * - Other email service
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SendEmailRequest = await request.json()
    
    if (!body.to || (Array.isArray(body.to) ? body.to.length === 0 : !body.to)) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      )
    }

    if (!body.subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

    // Get user info for sender
    const { data: user } = await supabase.auth.getUser()
    const senderEmail = user.user?.email || 'noreply@lifehub.app'
    const senderName = user.user?.user_metadata?.name || 'LifeHub User'

    // Get shared link if provided
    let shareUrl = ''
    if (body.share_link_id) {
      const { data: link } = await supabase
        .from('shared_links')
        .select('share_token')
        .eq('id', body.share_link_id)
        .eq('user_id', session.user.id)
        .single()

      if (link) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lifehub.app'
        shareUrl = `${baseUrl}/shared/${link.share_token}`
      }
    }

    // Build email HTML
    const emailHtml = generateEmailHTML({
      subject: body.subject,
      message: body.message || '',
      shareUrl,
      senderName,
      attachments: body.attachments
    })

    // TODO: Integrate with actual email service
    // For now, log the email (in production, send via Resend/SendGrid)
    console.log('📧 Email to send:', {
      to: body.to,
      from: `${senderName} <${senderEmail}>`,
      subject: body.subject,
      html: emailHtml.substring(0, 200) + '...',
      attachments: body.attachments?.length || 0
    })

    // Simulate email sending
    // In production:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: Array.isArray(body.to) ? body.to : [body.to],
      subject: body.subject,
      html: emailHtml,
      attachments: body.attachments
    })
    */

    const response: SendEmailResponse = {
      success: true,
      message: 'Email sent successfully',
      email_id: `sim_${Date.now()}` // Simulated ID
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Exception in POST /api/share/email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

/**
 * Generate beautiful email HTML
 */
function generateEmailHTML(options: {
  subject: string
  message: string
  shareUrl?: string
  senderName: string
  attachments?: any[]
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .message {
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .share-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .share-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .attachments {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .attachment-item {
      display: flex;
      align-items: center;
      padding: 10px;
      background: white;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📤 ${options.subject}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Shared from LifeHub</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; color: #666;">Hi there,</p>
      
      <div class="message">
        <p><strong>${options.senderName}</strong> has shared something with you:</p>
        ${options.message ? `<p>${options.message.replace(/\n/g, '<br>')}</p>` : ''}
      </div>
      
      ${options.shareUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.shareUrl}" class="share-button">
            🔗 View Shared Content
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center;">
          Or copy this link: <a href="${options.shareUrl}" style="color: #667eea;">${options.shareUrl}</a>
        </p>
      ` : ''}
      
      ${options.attachments && options.attachments.length > 0 ? `
        <div class="attachments">
          <strong>📎 Attachments (${options.attachments.length})</strong>
          ${options.attachments.map(att => `
            <div class="attachment-item">
              <span>📄 ${att.filename}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>This email was sent from <a href="https://lifehub.app">LifeHub</a></p>
      <p style="font-size: 12px; color: #999; margin-top: 10px;">
        Manage your personal life with ease
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

