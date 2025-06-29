# Invoicely - Professional Invoice Management SaaS

A full-stack invoice management SaaS application built with Next.js, featuring professional invoice creation, client management, payment processing, and email automation.

## 🚀 Features

- **Professional Invoice Creation**: Create beautiful, customizable invoices with PDF generation
- **Client Management**: Complete CRUD operations for client information
- **Payment Processing**: Stripe integration for secure online payments
- **Email Automation**: Send invoices directly to clients with PDF attachments
- **Analytics Dashboard**: Real-time insights into your invoicing business
- **Google OAuth**: Secure authentication with Google accounts
- **Responsive Design**: Modern UI that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth
- **PDF Generation**: pdf-lib and react-pdf
- **Payment Processing**: Stripe
- **Email Service**: Resend
- **Deployment**: Vercel

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Google OAuth credentials
- Stripe account and API keys
- Resend account and API key

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoicely
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
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
   
   # Resend
   RESEND_API_KEY=your_resend_api_key
   FROM_EMAIL=your_verified_email@domain.com
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
invoicely/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── auth/          # Authentication routes
│   │   ├── clients/       # Client management
│   │   ├── invoices/      # Invoice management
│   │   ├── payments/      # Payment processing
│   │   └── webhooks/      # Webhook handlers
│   ├── auth/              # Authentication pages
│   ├── clients/           # Client pages
│   ├── dashboard/         # Dashboard
│   ├── invoices/          # Invoice pages
│   └── analytics/         # Analytics page
├── components/            # Reusable components
├── lib/                   # Utility libraries
├── models/                # Mongoose models
└── public/                # Static assets
```

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### Stripe Setup

1. Create a Stripe account
2. Get your API keys from the dashboard
3. Set up webhook endpoints for payment events
4. Configure webhook secret

### Resend Email Setup

1. Create a Resend account
2. Get your API key
3. Verify your domain or use sandbox email
4. See `EMAIL_SETUP.md` for detailed instructions

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to update these for production:

- `NEXTAUTH_URL`: Your production domain
- `GOOGLE_CLIENT_ID`: Add production redirect URI
- `STRIPE_WEBHOOK_SECRET`: Production webhook secret
- `FROM_EMAIL`: Verified domain email

## 📊 Features Overview

### Invoice Management
- Create professional invoices with custom branding
- Add multiple line items with tax calculations
- Generate PDF invoices automatically
- Track invoice status (draft, sent, paid)

### Client Management
- Store client information securely
- Manage multiple clients
- View client invoice history

### Payment Processing
- Stripe integration for secure payments
- Automatic invoice status updates
- Payment confirmation emails

### Email Automation
- Send invoices directly to clients
- PDF attachments included
- Email delivery tracking
- Payment reminder system

### Analytics Dashboard
- Revenue tracking
- Invoice statistics
- Payment analytics
- Client insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the setup guides

<!-- Trigger redeploy -->

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS 