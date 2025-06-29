import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';

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
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
    const { clientId, dueDate, items, taxRate, notes, terms, status } = body;

    // Calculate totals if items are provided
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;

    if (items && items.length > 0) {
      subtotal = items.reduce((sum: number, item: any) => {
        const amount = item.quantity * item.rate;
        return sum + amount;
      }, 0);

      taxAmount = (subtotal * (taxRate || 0)) / 100;
      total = subtotal + taxAmount;
    }

    const updateData: any = {
      clientId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      taxRate: taxRate || 0,
      notes,
      terms,
      status,
    };

    if (items && items.length > 0) {
      updateData.items = items.map((item: any) => ({
        ...item,
        amount: item.quantity * item.rate,
      }));
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('clientId', 'name email address phone company');

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const invoice = await Invoice.findOneAndDelete({ _id: params.id, userId: user._id });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 