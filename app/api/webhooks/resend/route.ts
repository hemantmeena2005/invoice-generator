import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (you should implement this for production)
    // const signature = request.headers.get('resend-signature');
    
    console.log('Resend webhook received:', body);

    const { type, data } = body;

    if (type === 'email.delivered') {
      await dbConnect();
      
      // Update invoice email status to delivered
      // Note: You'll need to store the messageId when sending emails to track this
      const { message_id } = data;
      
      // Find invoice by messageId in emailLogs
      const invoice = await Invoice.findOne({
        'emailLogs.messageId': message_id
      });

      if (invoice) {
        await Invoice.updateOne(
          { 
            _id: invoice._id,
            'emailLogs.messageId': message_id 
          },
          { 
            $set: {
              'emailLogs.$.status': 'delivered',
              emailStatus: 'delivered'
            }
          }
        );
        
        console.log(`Updated invoice ${invoice.invoiceNumber} email status to delivered`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 