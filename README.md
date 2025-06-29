# Invoice Generator SaaS

A modern, full-stack SaaS application for generating invoices and managing clients with integrated payment processing.

## Features

- 🔐 **Authentication**: NextAuth.js with Google OAuth
- 👥 **Client Management**: Create, view, and manage clients
- 📄 **Invoice Generation**: Create professional invoices with PDF export
- 💳 **Payment Processing**: Stripe integration for secure payments
- 📊 **Dashboard**: Analytics and overview of your business
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **PDF Generation**: pdf-lib, react-pdf
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Google OAuth credentials
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hemantmeena2005/invoice-generator.git
cd invoice-generator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
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
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

1. **MongoDB**: Create a free cluster at [MongoDB Atlas](https://mongodb.com/atlas)
2. **Google OAuth**: Set up OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
3. **Stripe**: Create an account and get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/)

## Usage

1. Sign in with your Google account
2. Add clients to your database
3. Create invoices for your clients
4. Send payment links or generate PDF invoices
5. Track payments and view analytics

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/clients` - Client management
- `/api/invoices` - Invoice management
- `/api/payments` - Payment processing
- `/api/webhooks/stripe` - Stripe webhook handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the maintainer. 