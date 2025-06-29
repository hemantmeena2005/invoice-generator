import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailInvoiceData {
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  pdfBytes?: Uint8Array
  invoiceId: string
}

export async function sendInvoiceEmail(data: EmailInvoiceData) {
  try {
    console.log('🔍 Starting email send process...')
    console.log('📧 Email data:', JSON.stringify(data, null, 2))
    console.log('🔑 API Key present:', !!process.env.RESEND_API_KEY)
    console.log('📤 From email:', process.env.FROM_EMAIL)
    
    const { to, clientName, invoiceNumber, amount, dueDate, pdfBytes, invoiceId } = data

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .invoice-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: #28a745; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #333;">Invoice ${invoiceNumber}</h1>
              <p style="margin: 10px 0 0 0; color: #6c757d;">Dear ${clientName},</p>
            </div>
            
            <div class="invoice-details">
              <p>Please find attached your invoice for the services provided.</p>
              
              <div style="margin: 20px 0;">
                <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                <strong>Amount Due:</strong> <span class="amount">$${amount.toLocaleString()}</span><br>
                <strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}
              </div>
              
              <p>You can view and download your invoice using the link below:</p>
              
              ${pdfBytes ? `
                <a href="data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}" class="button">View Invoice</a>
              ` : `
                <p><em>Invoice PDF will be available shortly.</em></p>
              `}
            </div>
            
            <div class="footer">
              <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `

    console.log('📝 Email content prepared, attempting to send...')

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'invoices@yourdomain.com',
      to: [to],
      subject: `Invoice ${invoiceNumber} - $${amount.toLocaleString()}`,
      html: emailContent,
      attachments: pdfBytes ? [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ] : undefined,
    })

    console.log('✅ Resend API response:', JSON.stringify(result, null, 2))

    return {
      success: true,
      messageId: result.data?.id,
      data: result.data
    }
  } catch (error) {
    console.error('❌ Error sending invoice email:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function sendInvoiceReminder(data: EmailInvoiceData) {
  try {
    console.log('🔍 Starting reminder email send process...')
    console.log('📧 Reminder email data:', JSON.stringify(data, null, 2))
    
    const { to, clientName, invoiceNumber, amount, dueDate, pdfBytes } = data

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder - Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeaa7; }
            .invoice-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: #dc3545; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #856404;">Payment Reminder</h1>
              <p style="margin: 10px 0 0 0; color: #856404;">Dear ${clientName},</p>
            </div>
            
            <div class="invoice-details">
              <p>This is a friendly reminder that payment for the following invoice is now due:</p>
              
              <div style="margin: 20px 0;">
                <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                <strong>Amount Due:</strong> <span class="amount">$${amount.toLocaleString()}</span><br>
                <strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}
              </div>
              
              <p>Please process the payment at your earliest convenience to avoid any late fees.</p>
              
              ${pdfBytes ? `
                <a href="data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}" class="button">View Invoice</a>
              ` : `
                <p><em>Invoice PDF will be available shortly.</em></p>
              `}
            </div>
            
            <div class="footer">
              <p>If you have already made the payment, please disregard this reminder.</p>
              <p>Thank you for your prompt attention to this matter.</p>
            </div>
          </div>
        </body>
      </html>
    `

    console.log('📝 Reminder email content prepared, attempting to send...')

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'invoices@yourdomain.com',
      to: [to],
      subject: `Payment Reminder - Invoice ${invoiceNumber}`,
      html: emailContent,
      attachments: pdfBytes ? [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ] : undefined,
    })

    console.log('✅ Resend API response for reminder:', JSON.stringify(result, null, 2))

    return {
      success: true,
      messageId: result.data?.id,
      data: result.data
    }
  } catch (error) {
    console.error('❌ Error sending invoice reminder:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 