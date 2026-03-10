# BingoBids

Lucky draw platform — join groups with configurable size, bid amount, and timer. One winner per group when it fills or when the timer ends.

## Tech Stack

- **Next.js 16** (App Router) — Full-stack React
- **Prisma** — PostgreSQL ORM
- **Tailwind CSS** — Styling
- **TypeScript** — Type safety

## Quick Start

### 1. Database

Use PostgreSQL. Options:

- **Neon** (free): [neon.tech](https://neon.tech) — create DB, copy connection string
- **Supabase** (free): [supabase.com](https://supabase.com)
- **Docker**: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`

### 2. Environment

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, ADMIN_SECRET, UPI_VPA, UPI_PAYEE_NAME
```

- **UPI_VPA**: Your UPI ID (e.g. `9876543210@paytm` or `name@okaxis`) — payments go here when users scan the QR.
- **UPI_PAYEE_NAME**: Name shown in the user’s UPI app (e.g. `BingoBids`).

### 3. Install & Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

- **Site**: http://localhost:3000
- **Admin**: http://localhost:3000/admin (use ADMIN_SECRET to login)

## Features

### Public Site
- Browse open groups
- Join with mobile + address
- 1–10 bids per person per group
- QR-based payment flow
- Member count per group

### Admin
- Create groups (max 10/day)
- View members per group
- Confirm payments
- Daily collection summary

## Business Rules

- 500 members per group
- ₹250 per bid
- Max 10 bids per person per group
- Groups close at 7 PM daily
- Max 10 groups per day

## Payments

- **Current (UPI QR):** Set `UPI_VPA` and `UPI_PAYEE_NAME` in `.env`. The payment QR is a **real UPI QR** — when users scan with GPay/PhonePe/Paytm, amount and reference are pre-filled and money goes to your UPI. You still **confirm** each payment in Admin → Payments after you see the credit.
- **Refunds:** When a group is **cancelled** (didn’t fill by 7 PM), go to **Admin → Refunds**. You’ll see every member who had a confirmed payment and the amount to refund. Use **Export CSV** and refund each person manually via UPI or bank. For automatic refunds you’d need a gateway like Razorpay.
- **Production / auto-verify:** For automatic confirmation (no manual “Confirm”), integrate **Razorpay** ([razorpay.com](https://razorpay.com)): create a Payment Link or Order via API, redirect user to Razorpay checkout (or show their QR), and use the **webhook** (`payment.captured`) to mark the payment confirmed in your DB. Razorpay also supports **refund API** so you can refund programmatically when a group is cancelled. Fees are typically ~2% per transaction.

## Going Live

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a cost-effective production setup (Vercel + Neon, domain, cron for 7 PM group closure).

## Project Structure

```
src/
├── app/
│   ├── (public)     # Home, Join
│   ├── admin/       # Admin dashboard
│   └── api/         # API routes
├── components/
├── lib/
└── prisma/
```
