# Email Setup Guide

This guide will help you set up email functionality for sending invoices to clients using Resend.

## Prerequisites

1. A Resend account (sign up at [resend.com](https://resend.com))
2. A domain for sending emails (or use Resend's sandbox domain for testing)

## Setup Steps

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Complete your account setup

### 2. Get API Key

1. In your Resend dashboard, go to the API Keys section
2. Create a new API key
3. Copy the API key (it starts with `re_`)

### 3. Domain Setup

#### Option A: Use Your Own Domain (Recommended for Production)

1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add the required DNS records:
   - MX record
   - SPF record
   - DKIM record
4. Wait for DNS verification (usually takes a few minutes)

#### Option B: Use Sandbox Domain (For Testing)

1. Resend provides a sandbox domain for testing
2. Use `onboarding@resend.dev` as your from email
3. Note: Sandbox domain has limitations and is not recommended for production

### 4. Environment Variables

Add these to your `.env.local` file:

```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=invoices@yourdomain.com
```

Replace:
- `re_your_api_key_here` with your actual Resend API key
- `invoices@yourdomain.com` with your verified domain email

### 5. Test Email Sending

1. Start your development server: `npm run dev`
2. Create a test invoice with a client that has an email address
3. Go to the invoice view page
4. Click "Send Invoice" button
5. Check the client's email inbox

## Email Features

### Invoice Emails
- Professional HTML email template
- PDF invoice attachment
- Invoice details in email body
- Payment link (if Stripe is configured)

### Payment Reminders
- Sent for overdue invoices
- Different template design
- Urgent payment messaging

### Email Tracking
- Track email delivery status
- View email history per invoice
- Monitor delivery rates

## Email Templates

The application includes two email templates:

### Invoice Template
- Clean, professional design
- Invoice details prominently displayed
- Call-to-action button for viewing invoice
- Company branding support

### Reminder Template
- Warning-style design for overdue invoices
- Urgent payment messaging
- Same invoice details and actions

## Customization

### Modify Email Templates

Edit the email templates in `lib/email.ts`:

```typescript
// Customize the HTML content
const emailContent = `
  <!DOCTYPE html>
  <html>
    <!-- Your custom HTML here -->
  </html>
`;
```

### Add Custom Fields

You can add custom fields to the email data:

```typescript
export interface EmailInvoiceData {
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  pdfUrl?: string
  invoiceId: string
  // Add custom fields here
  customMessage?: string
  companyLogo?: string
}
```

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check your Resend API key
   - Verify your domain is properly configured
   - Check the browser console for errors

2. **Emails going to spam**
   - Ensure proper DNS records are set up
   - Use a verified domain
   - Avoid spam trigger words in subject lines

3. **PDF attachment issues**
   - Check that the PDF generation endpoint is working
   - Verify the PDF URL is accessible

4. **Delivery status not updating**
   - Check webhook configuration
   - Verify webhook endpoint is accessible
   - Check webhook logs in Resend dashboard

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_EMAIL=true
```

This will log email sending attempts to the console.

## Production Considerations

### Security
- Use environment variables for API keys
- Implement webhook signature verification
- Use HTTPS in production

### Performance
- Implement email queuing for high volume
- Add retry logic for failed emails
- Monitor email delivery rates

### Compliance
- Ensure GDPR compliance for email storage
- Add unsubscribe links if required
- Follow email marketing best practices

## Support

For Resend-specific issues:
- [Resend Documentation](https://resend.com/docs)
- [Resend Support](https://resend.com/support)

For application-specific issues:
- Check the application logs
- Review the API responses
- Contact the development team 