import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import { sendInvoiceEmail, sendInvoiceReminder } from '@/lib/email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { emailType = 'invoice', customMessage } = body;

    const invoice = await Invoice.findOne({ _id: params.id, userId: user._id })
      .populate('clientId', 'name email');
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.clientId.email) {
      return NextResponse.json({ error: 'Client email not found' }, { status: 400 });
    }

    // Generate PDF content directly
    const pdfBytes = await generateInvoicePDF(invoice);

    // Prepare email data
    const emailData = {
      to: invoice.clientId.email,
      clientName: invoice.clientId.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      dueDate: invoice.dueDate,
      pdfBytes,
      invoiceId: invoice._id.toString(),
    };

    // Send email
    const emailResult = emailType === 'reminder' 
      ? await sendInvoiceReminder(emailData)
      : await sendInvoiceEmail(emailData);

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: emailResult.error 
      }, { status: 500 });
    }

    // Update invoice with email log
    const emailLog = {
      sentAt: new Date(),
      messageId: emailResult.messageId,
      emailType,
      recipient: invoice.clientId.email,
      status: 'sent',
    };

    await Invoice.findByIdAndUpdate(invoice._id, {
      $push: { emailLogs: emailLog },
      lastEmailedAt: new Date(),
      emailStatus: 'sent',
      ...(invoice.status === 'draft' && emailType === 'invoice' ? { status: 'sent' } : {}),
    });

    return NextResponse.json({ 
      success: true, 
      messageId: emailResult.messageId,
      message: `${emailType === 'reminder' ? 'Reminder' : 'Invoice'} sent successfully` 
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateInvoicePDF(invoice: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;
  
  let y = height - 50;
  
  // Header
  page.drawText('INVOICE', { x: 50, y, size: 24, font, color: rgb(0, 0, 0) });
  y -= 40;
  
  // Invoice details
  page.drawText(`Invoice Number: ${invoice.invoiceNumber}`, { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  page.drawText(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  page.drawText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  
  // Client info
  y -= 20;
  page.drawText('Bill To:', { x: 50, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
  y -= lineHeight;
  page.drawText(invoice.clientId.name, { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  if (invoice.clientId.email) {
    page.drawText(invoice.clientId.email, { x: 50, y, size: fontSize, font });
    y -= lineHeight;
  }
  
  // Items table
  y -= 30;
  page.drawText('Items:', { x: 50, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
  y -= lineHeight;
  
  // Table headers
  page.drawText('Description', { x: 50, y, size: fontSize, font });
  page.drawText('Qty', { x: 300, y, size: fontSize, font });
  page.drawText('Rate', { x: 350, y, size: fontSize, font });
  page.drawText('Amount', { x: 450, y, size: fontSize, font });
  y -= lineHeight;
  
  // Table rows
  for (const item of invoice.items) {
    page.drawText(item.description, { x: 50, y, size: fontSize, font });
    page.drawText(item.quantity.toString(), { x: 300, y, size: fontSize, font });
    page.drawText(`$${item.rate.toFixed(2)}`, { x: 350, y, size: fontSize, font });
    page.drawText(`$${item.amount.toFixed(2)}`, { x: 450, y, size: fontSize, font });
    y -= lineHeight;
  }
  
  // Totals
  y -= 20;
  page.drawText(`Subtotal: $${invoice.subtotal.toFixed(2)}`, { x: 350, y, size: fontSize, font });
  y -= lineHeight;
  if (invoice.taxRate > 0) {
    page.drawText(`Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}`, { x: 350, y, size: fontSize, font });
    y -= lineHeight;
  }
  page.drawText(`Total: $${invoice.total.toFixed(2)}`, { x: 350, y, size: fontSize, font, color: rgb(0, 0, 0) });
  
  return await pdfDoc.save();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invoice = await Invoice.findOne({ _id: params.id, userId: user._id })
      .populate('clientId', 'name email')
      .select('emailLogs lastEmailedAt emailStatus clientId');
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      emailLogs: invoice.emailLogs || [],
      lastEmailedAt: invoice.lastEmailedAt,
      emailStatus: invoice.emailStatus,
      clientEmail: invoice.clientId.email,
    });

  } catch (error) {
    console.error('Error fetching invoice email logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 