import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    console.log('Webhook received:', { bodyLength: body.length, signature: signature ? 'present' : 'missing' });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('Webhook event type:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout.session.completed:', { 
          sessionId: session.id, 
          invoiceId: session.metadata?.invoiceId,
          paymentIntent: session.payment_intent 
        });
        
        if (session.metadata?.invoiceId) {
          const updatedInvoice = await Invoice.findByIdAndUpdate(
            session.metadata.invoiceId,
            {
              status: 'paid',
              stripePaymentIntentId: session.payment_intent as string,
              paidAt: new Date(),
            },
            { new: true }
          );
          console.log('Invoice updated:', { 
            invoiceId: session.metadata.invoiceId, 
            newStatus: updatedInvoice?.status 
          });
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.succeeded:', { paymentIntentId: paymentIntent.id });
        
        // Find invoice by payment intent ID
        const invoice = await Invoice.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });
        
        if (invoice) {
          const updatedInvoice = await Invoice.findByIdAndUpdate(invoice._id, {
            status: 'paid',
            paidAt: new Date(),
          }, { new: true });
          console.log('Invoice updated via payment intent:', { 
            invoiceId: invoice._id, 
            newStatus: updatedInvoice?.status 
          });
        } else {
          console.log('No invoice found for payment intent:', paymentIntent.id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.payment_failed:', { paymentIntentId: failedPaymentIntent.id });
        
        // Find invoice by payment intent ID
        const failedInvoice = await Invoice.findOne({
          stripePaymentIntentId: failedPaymentIntent.id,
        });
        
        if (failedInvoice) {
          const updatedInvoice = await Invoice.findByIdAndUpdate(failedInvoice._id, {
            status: 'sent', // Reset to sent status
          }, { new: true });
          console.log('Invoice reset to sent status:', { 
            invoiceId: failedInvoice._id, 
            newStatus: updatedInvoice?.status 
          });
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 