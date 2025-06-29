# Invoice Generator & Client Portal SaaS

A full-stack SaaS application for generating invoices, managing clients, and processing payments. Built with Next.js, MongoDB, and Stripe.

## Features

- **Authentication**: Google OAuth with NextAuth.js
- **Client Management**: CRUD operations for clients
- **Invoice Generation**: Create, edit, and manage invoices
- **PDF Generation**: Automatic PDF invoice generation
- **Payment Processing**: Stripe integration for online payments
- **Email Invoicing**: Send invoices directly to clients via email
- **Dashboard Analytics**: Real-time business metrics and insights
- **Email Tracking**: Monitor email delivery status and history

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB
- **Payments**: Stripe
- **Email**: Resend
- **PDF Generation**: pdf-lib, react-pdf
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Google OAuth credentials
- Stripe account
- Resend account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd saasapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Resend (Email Service)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=invoices@yourdomain.com
```

### Environment Variables Setup

#### MongoDB
1. Create a MongoDB database (MongoDB Atlas recommended)
2. Get your connection string and add it to `MONGODB_URI`

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy Client ID and Client Secret to environment variables

#### Stripe
1. Create a Stripe account
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks for payment events
4. Add webhook endpoint: `http://localhost:3000/api/webhooks/stripe`

#### Resend (Email Service)
1. Sign up at [Resend](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain or use the sandbox domain for testing
4. Set the `FROM_EMAIL` to your verified domain

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Sign in with Google OAuth

## Email Invoicing Features

### Sending Invoices
- Send invoices directly to clients via email
- PDF attachments included automatically
- Professional email templates
- Email delivery tracking

### Email Status Tracking
- Track email delivery status (sent, delivered, failed)
- View email history for each invoice
- Send payment reminders for overdue invoices
- Email analytics in dashboard

### Email Templates
- Professional invoice email template
- Payment reminder template
- Customizable email content
- Responsive design

## API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get specific client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get specific invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/[id]/pdf` - Generate PDF
- `POST /api/invoices/[id]/send-email` - Send invoice via email
- `GET /api/invoices/[id]/send-email` - Get email status

### Payments
- `POST /api/payments/create-checkout` - Create Stripe checkout session

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/resend` - Resend webhook handler (optional)

### Analytics
- `GET /api/analytics` - Get dashboard analytics

## Database Schema

### User
```typescript
{
  _id: ObjectId
  email: string
  name: string
  image?: string
  createdAt: Date
  updatedAt: Date
}
```

### Client
```typescript
{
  _id: ObjectId
  userId: ObjectId
  name: string
  email: string
  company?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

### Invoice
```typescript
{
  _id: ObjectId
  userId: ObjectId
  clientId: ObjectId
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: Date
  dueDate: Date
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  terms?: string
  stripePaymentIntentId?: string
  paidAt?: Date
  emailLogs: Array<{
    sentAt: Date
    messageId?: string
    emailType: 'invoice' | 'reminder'
    recipient: string
    status: 'sent' | 'delivered' | 'failed'
    error?: string
  }>
  lastEmailedAt?: Date
  emailStatus: 'not_sent' | 'sent' | 'delivered' | 'failed'
  createdAt: Date
  updatedAt: Date
}
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team. 