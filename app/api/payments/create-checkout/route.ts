import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, userId: user._id })
      .populate('clientId', 'name email company');

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // Debug: Log the environment variable
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-generator-seven-omega.vercel.app';
    console.log('Using base URL:', baseUrl);
    
    const successUrl = `${baseUrl}/invoices/${invoiceId}?success=true`;
    const cancelUrl = `${baseUrl}/invoices/${invoiceId}?canceled=true`;
    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);

    // Create Stripe checkout session with proper redirect URLs
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Invoice for ${invoice.clientId.name}`,
            },
            unit_amount: Math.round(invoice.total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        invoiceId: invoiceId,
        userId: user._id.toString(),
      },
    });

    console.log('Stripe checkout session created:', {
      sessionId: checkoutSession.id,
      successUrl: checkoutSession.success_url,
      cancelUrl: checkoutSession.cancel_url,
      checkoutUrl: checkoutSession.url
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 