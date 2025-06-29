import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';

export async function GET() {
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

    const invoices = await Invoice.find({ userId: user._id })
      .populate('clientId', 'name email company')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { clientId, dueDate, items, taxRate, notes, terms } = body;

    if (!clientId || !dueDate || !items || items.length === 0) {
      return NextResponse.json({ 
        error: 'Client, due date, and at least one item are required' 
      }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      const amount = item.quantity * item.rate;
      return sum + amount;
    }, 0);

    const taxAmount = (subtotal * (taxRate || 0)) / 100;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const lastInvoice = await Invoice.findOne(
      { userId: user._id },
      {},
      { sort: { invoiceNumber: -1 } }
    );
    
    let lastNumber = 0;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}(\d{4})/);
      if (match) {
        lastNumber = parseInt(match[1]);
      }
    }
    
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}${String(lastNumber + 1).padStart(4, '0')}`;

    const invoice = new Invoice({
      userId: user._id,
      clientId,
      invoiceNumber,
      dueDate: new Date(dueDate),
      items: items.map((item: any) => ({
        ...item,
        amount: item.quantity * item.rate,
      })),
      subtotal,
      taxRate: taxRate || 0,
      taxAmount,
      total,
      notes,
      terms,
    });

    await invoice.save();
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 