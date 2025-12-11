import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, data, template } = await request.json()
    
    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data required' }, { status: 400 })
    }

    // Generate HTML content based on document type
    const htmlContent = generateHTMLForType(type, data)

    // Return HTML that can be converted to PDF on client side
    // In a production app, you'd use a library like puppeteer or a PDF generation service
    return NextResponse.json({
      html: htmlContent,
      success: true,
      message: 'PDF template generated. Use browser print or PDF library to convert.'
    })
  } catch (error: any) {
    console.error('❌ Exception in POST /api/ai-tools/generate-pdf:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateHTMLForType(type: string, data: any): string {
  const generators: Record<string, (data: any) => string> = {
    invoice: (data) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .invoice-details { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Invoice #: ${data.invoice_number || 'N/A'}</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div class="invoice-details">
    <h3>Bill To:</h3>
    <p><strong>${data.client_name || 'N/A'}</strong></p>
    <p>${data.client_email || ''}</p>
    <p>${data.client_address || ''}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${(data.items || []).map((item: any) => `
        <tr>
          <td>${item.description || ''}</td>
          <td>${item.quantity || 1}</td>
          <td>$${item.rate || 0}</td>
          <td>$${(item.quantity || 1) * (item.rate || 0)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="total">
    <p>Subtotal: $${data.subtotal || 0}</p>
    <p>Tax: $${data.tax || 0}</p>
    <p>TOTAL: $${data.total || 0}</p>
  </div>
  
  <p style="margin-top: 40px;">Due Date: ${data.due_date || 'Upon receipt'}</p>
</body>
</html>`,

    receipt: (data) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
    .receipt-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
    .receipt-item { display: flex; justify-content: space-between; padding: 5px 0; }
    .receipt-total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="receipt-header">
    <h2>${data.merchant_name || 'Receipt'}</h2>
    <p>${new Date(data.date || Date.now()).toLocaleString()}</p>
  </div>
  
  ${(data.items || []).map((item: any) => `
    <div class="receipt-item">
      <span>${item.name || 'Item'}</span>
      <span>$${item.price || 0}</span>
    </div>
  `).join('')}
  
  <div class="receipt-total">
    <div class="receipt-item">
      <span>Subtotal:</span>
      <span>$${data.subtotal || 0}</span>
    </div>
    <div class="receipt-item">
      <span>Tax:</span>
      <span>$${data.tax || 0}</span>
    </div>
    <div class="receipt-item" style="font-size: 18px;">
      <span>TOTAL:</span>
      <span>$${data.amount || 0}</span>
    </div>
  </div>
</body>
</html>`,

    form: (data) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .form-title { text-align: center; margin-bottom: 30px; }
    .form-field { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ddd; }
    .form-label { font-weight: bold; color: #666; margin-bottom: 5px; }
    .form-value { font-size: 16px; }
  </style>
</head>
<body>
  <div class="form-title">
    <h1>${data.form_name || 'Form'}</h1>
    <p>${data.form_type || ''}</p>
  </div>
  
  ${Object.entries(data.form_data || {}).map(([key, value]) => `
    <div class="form-field">
      <div class="form-label">${key.replace(/_/g, ' ').toUpperCase()}</div>
      <div class="form-value">${value}</div>
    </div>
  `).join('')}
  
  <p style="margin-top: 40px; text-align: center; color: #999;">
    Generated on ${new Date().toLocaleDateString()}
  </p>
</body>
</html>`,

    report: (data) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .report-header { border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>${data.report_name || 'Financial Report'}</h1>
    <p>Period: ${data.period_start || ''} to ${data.period_end || ''}</p>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div class="section">
    <h2 class="section-title">Summary</h2>
    <p>${data.summary || 'No summary available'}</p>
  </div>
  
  ${data.sections ? data.sections.map((section: any) => `
    <div class="section">
      <h2 class="section-title">${section.title || ''}</h2>
      ${section.content || ''}
    </div>
  `).join('') : ''}
</body>
</html>`
  }

  const generator = generators[type] || generators.report
  return generator(data)
}
