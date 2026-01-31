# Deliverly - Shopify Delivery Management System

Internal delivery management system for a single Shopify store.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **Mobile**: Android app (separate project)

## Features

- Shopify order sync via webhooks
- Office dashboard for order management
- Rider assignment and tracking
- Proof of delivery with photos
- Automatic Shopify fulfillment
- Public order tracking

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
