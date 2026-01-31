# Deliverly - Shopify Delivery Management System

## Project Overview
Internal delivery management system for a single Shopify store. Next.js + Supabase + Android rider app.

## Key Constraints
- Single-store internal tool (NOT multi-tenant SaaS)
- No billing, no marketplace logic
- Low order volume assumption
- Vercel serverless deployment

## Architecture
- **Frontend**: Next.js 14+ App Router with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (private buckets)
- **Deployment**: Vercel
- **Mobile**: Separate Android app (API consumer)

## Critical Implementation Notes

### Shopify Fulfillment API
- Use Fulfillment Orders workflow (2024-01 API)
- GET /fulfillment_orders.json first
- POST /fulfillments.json with `line_items_by_fulfillment_order`
- Field: `fulfillment_order_line_items` (NOT `fulfillment_request_order_line_items`)

### Webhook Handling
- Read raw body FIRST: `await request.text()`
- Verify HMAC before parsing
- Process synchronously (Vercel constraint)
- Must respond within 5 seconds

### Security
- HMAC verification on all webhooks
- Private Supabase Storage buckets
- Signed URLs with 1-hour expiry
- Rider authorization: filter by authenticated user

### Code Generation
- tracking_code: use nanoid(10) in backend
- No DB default functions for nanoid

## Development Guidelines
- Use TypeScript strict mode
- Follow Next.js App Router conventions
- Keep API routes focused and simple
- Log errors properly for debugging
- Test webhook flows thoroughly
