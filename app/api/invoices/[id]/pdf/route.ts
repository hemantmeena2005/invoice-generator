import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';

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
      .populate('clientId', 'name email address phone company');
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const primaryColor = rgb(0.2, 0.2, 0.2);
    const secondaryColor = rgb(0.5, 0.5, 0.5);

    let yPosition = height - 50;

    // Header
    page.drawText('INVOICE', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 40;

    // Invoice details
    page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    page.drawText(`Date: ${format(new Date(invoice.issueDate), 'MMM dd, yyyy')}`, {
      x: 200,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    page.drawText(`Due Date: ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 60;

    // From section
    page.drawText('From:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(user.name, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 15;
    page.drawText(user.email, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 40;

    // To section
    page.drawText('To:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(invoice.clientId.name, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 15;
    page.drawText(invoice.clientId.email, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    if (invoice.clientId.company) {
      yPosition -= 15;
      page.drawText(invoice.clientId.company, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });
    }

    yPosition -= 40;

    // Items table header
    const tableY = yPosition;
    page.drawText('Description', {
      x: 50,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('Qty', {
      x: 300,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('Rate', {
      x: 350,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('Amount', {
      x: 450,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 30;

    // Items
    invoice.items.forEach((item: any) => {
      page.drawText(item.description, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText(item.quantity.toString(), {
        x: 300,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText(`$${item.rate.toFixed(2)}`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText(`$${item.amount.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      yPosition -= 20;
    });

    yPosition -= 20;

    // Totals
    page.drawText(`Subtotal: $${invoice.subtotal.toFixed(2)}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(`Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(`Total: $${invoice.total.toFixed(2)}`, {
      x: 350,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    // Notes
    if (invoice.notes) {
      yPosition -= 40;
      page.drawText('Notes:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 20;
      page.drawText(invoice.notes, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });
    }

    // Terms
    if (invoice.terms) {
      yPosition -= 40;
      page.drawText('Terms:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 20;
      page.drawText(invoice.terms, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 