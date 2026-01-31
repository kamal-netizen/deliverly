# Deliverly - Delivery Management System

Internal delivery management system for Shopify stores. Complete full-stack application with dashboard and mobile app support.

## Tech Stack

- **Frontend**: Next.js 15 App Router, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **State Management**: TanStack Query
- **API**: Shopify REST Admin API
- **Deployment**: Vercel

## Features

- **Order Management**: Automatic sync from Shopify, real-time tracking
- **Rider Management**: Assign orders, track performance, manage availability
- **Analytics Dashboard**: View stats, track deliveries, monitor performance
- **Proof of Delivery**: Photo capture and delivery verification
- **Shopify Integration**: Seamless two-way sync with fulfillment API
- **Marketing Site**: Landing page, features, pricing, contact pages
- **Mobile Responsive**: Works on all devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

3. Setup Supabase:
   - Create a new project
   - Run database migrations (see `/supabase/migrations`)
   - Copy project URL and keys to `.env`

4. Setup Shopify App:
   - Create a Shopify Partner account
   - Create a new app
   - Configure OAuth redirect and webhook URLs
   - Copy API credentials to `.env`

5. Run development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/shopify/         # Shopify OAuth
│   │   ├── webhooks/              # Webhook handlers
│   │   ├── orders/                # Order management
│   │   ├── assignments/           # Rider assignments
│   │   ├── rider/                 # Rider endpoints
│   │   └── track/                 # Public tracking
│   ├── dashboard/                 # Office staff UI
│   └── track/                     # Public tracking pages
├── lib/
│   ├── shopify.ts                 # Shopify API client
│   ├── supabase.ts                # Supabase client
│   ├── webhook-verify.ts          # HMAC verification
│   └── fulfillment.ts             # Fulfillment logic
├── types/
│   └── database.ts                # Database types
└── supabase/
    └── migrations/                # SQL migrations
```

## Environment Variables

See `.env.example` for required variables.

## License

Private - Internal use only
