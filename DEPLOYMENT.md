# Going Live — Cost-Effective Guide

Best approach for **~5000 users/day** with minimal cost.

---

## Step-by-step: Zero to live

Follow in order. Tick each when done.

### 1. Create production database (Neon)

1. Go to **[neon.tech](https://neon.tech)** → Sign up (GitHub/email).
2. **New Project** → name it e.g. `bingobids` → Create.
3. On the project dashboard, open **Connection details**.
4. Copy the **pooled** connection string (host has `-pooler`). Example:  
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`  
5. Save it somewhere safe — you need it in Step 3.

---

### 2. Put code on GitHub

1. Create a new repo on **[github.com](https://github.com)** (e.g. `bingobids`). Don’t add README if your folder already has one.
2. On your PC, open a terminal in the **project** folder (where `package.json` is).
3. Run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bingobids.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username. If the repo already exists and has a remote, just `git push`.

---

### 3. Deploy on Vercel and set env vars

1. Go to **[vercel.com](https://vercel.com)** → Sign in with **GitHub**.
2. **Add New** → **Project** → **Import** your `bingobids` repo.
3. Before clicking **Deploy**, open **Environment Variables**.
4. Add these (use **Production**):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Neon pooled connection string from Step 1 |
   | `ADMIN_SECRET` | Long random string (e.g. 32+ chars) — you’ll use this to log into /admin |
   | `UPI_VPA` | Your UPI ID (e.g. `9876543210@paytm`) |
   | `UPI_PAYEE_NAME` | e.g. `BingoBids` |
   | `CRON_SECRET` | Another long random string — for the 7 PM cron |

5. Click **Deploy**. Wait for the build to finish.
6. Your app is live at `https://bingobids-xxx.vercel.app` (or similar). Open it and check the home page.

---

### 4. Create tables and seed data (first time only)

1. On your PC, in the **project** folder, set the production DB URL and run Prisma:

   **Windows (PowerShell):**
   ```powershell
   $env:DATABASE_URL="postgresql://...paste-your-neon-pooled-url..."
   npx prisma db push
   npx prisma db seed
   ```

   **Mac/Linux:**
   ```bash
   export DATABASE_URL="postgresql://...paste-your-neon-pooled-url..."
   npx prisma db push
   npx prisma db seed
   ```

2. If `db seed` fails (e.g. no seed script), that’s OK — `db push` is the important part so tables exist.

---

### 5. Add your domain (CheckMyLuck.com)

1. Buy your domain (e.g. **bingobids.com**) from Namecheap, Cloudflare, Porkbun, or Squarespace if you don’t have it.
2. In **Vercel** → your project → **Settings** → **Domains** → **Add** → type your domain (e.g. `bingobids.com`) → Add.
3. Vercel will show DNS instructions. Usually:
   - **A record** for `@` → `76.76.21.21` (or the IP Vercel shows)
   - **CNAME** for `www` → `cname.vercel-dns.com` (or the value Vercel shows)
4. In your **domain registrar** dashboard, open **DNS** / **Manage DNS** for your domain and add those records.
5. Save. Wait 5–60 minutes (up to 24h in rare cases). In Vercel, the domain will show as verified and HTTPS will work.

---

### 6. Set up 7 PM daily cron (close groups)

1. Go to **[cron-job.org](https://cron-job.org)** → Sign up (free).
2. **Create cron job**:
   - **URL:** `https://yourdomain.com/api/cron/close-groups` (or your Vercel URL if domain isn’t ready yet).
   - **Schedule:** Daily → Timezone **Asia/Kolkata** → Time **19:01** (7:01 PM).
   - **Request headers:** Add header `Authorization` with value `Bearer YOUR_CRON_SECRET` (the same value you set in Vercel as `CRON_SECRET`).
3. Save. The job will run every day at 7:01 PM IST and close due groups.

---

### 7. Final checks

- [ ] Open your live URL — home page and live groups load.
- [ ] Go to **/admin** — log in with `ADMIN_SECRET`.
- [ ] Create a test group in Admin, then join it from the public site and complete payment (UPI QR). Confirm the payment in Admin.

You’re live.

---

## Recommended: Vercel + Neon (Free / ~$0–20/month)

| Component   | Service | Cost | Notes |
|------------|---------|------|--------|
| **App**    | Vercel  | **Free** (Hobby) or $20/mo (Pro) | Next.js, serverless, global CDN. Hobby: 100 GB bandwidth; upgrade if you outgrow. |
| **Database** | Neon   | **Free** tier or ~$19/mo | PostgreSQL. Free: 0.5 GB, 1 project. Scale when needed. |
| **Domain** | Any registrar | ~₹500–800/year | Point your domain (e.g. bingobids.com) to Vercel. |
| **Cron**   | Vercel Cron or cron-job.org | **Free** | Close groups at 7 PM daily. |

**Rough monthly cost:** **₹0** (free tiers) or **~$20** (Vercel Pro + Neon paid when you scale).

---

## Will it handle ~5000 users/day?

**Yes**, with a few choices:

| Layer | Free tier | For 5k users/day |
|-------|-----------|-------------------|
| **Vercel** | 100 GB bandwidth/mo | ~5k users × ~5 requests × ~150 KB ≈ **100–150 GB/mo**. You may touch the 100 GB limit; monitor and upgrade to Pro ($20/mo) if you hit it. |
| **Neon** | 0.5 GB, pooled connections | Use Neon’s **pooled** connection string (e.g. `…@ep-xxx-pooler.region.aws.neon.tech`) so serverless doesn’t exhaust connections. Storage is fine for groups/members/payments. |
| **App** | — | The public **live groups** API is cached for 60s, so the DB isn’t hit on every home page view. |

**Recommendation:** Start on free tiers. Use Neon’s **pooler** URL as `DATABASE_URL`. If Vercel warns about bandwidth or you see throttling, move to Vercel Pro. For heavier DB use, upgrade Neon when needed.

---

## Step 1: Database (Neon) — Free

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Create a project (e.g. `bingobids`).
3. In the Neon dashboard, get the **connection string**. For production (and for ~5000 users/day), use the **pooled** connection string so serverless doesn’t exhaust DB connections — it usually contains `-pooler` in the host (e.g. `ep-xxx-pooler.region.aws.neon.tech`).
4. Save it — you’ll add it to Vercel as `DATABASE_URL`.

---

## Step 2: Deploy App (Vercel) — Free

1. Push your code to **GitHub** (create a repo, push the project folder).
2. Go to [vercel.com](https://vercel.com) → Sign in with GitHub.
3. **Import** your repo. Vercel will detect Next.js.
4. Before deploying, set **Environment Variables** in the Vercel project:

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | Your Neon connection string | From Step 1 |
   | `ADMIN_SECRET` | Strong random string | e.g. 32+ chars, keep private |
   | `UPI_VPA` | Your UPI ID | e.g. `9876543210@paytm` |
   | `UPI_PAYEE_NAME` | BingoBids | Name shown in UPI app |
   | `CRON_SECRET` | Strong random string | For 7 PM cron; keep private |

5. Deploy. Your site will be at `https://your-project.vercel.app`.

---

## Step 3: Custom Domain (CheckMyLuck.com)

1. Buy the domain (if you don’t have it) from Namecheap, GoDaddy, or Google Domains.
2. In **Vercel** → Project → **Settings** → **Domains** → Add your domain (e.g. `bingobids.com` and `www.bingobids.com` if you want).
3. In your domain registrar, add the **DNS records** Vercel shows (usually an A record or CNAME). Vercel will guide you.

---

## Step 4: Run Migrations on Production DB

After first deploy, run Prisma once against production so tables exist:

```bash
# Use production DATABASE_URL (from Neon)
set DATABASE_URL=postgresql://...your-neon-url...
npx prisma db push
npx prisma db seed
```

Or use **Vercel’s** env when running locally: put Neon URL in `.env`, then:

```bash
npx prisma db push
npx prisma db seed
```

(If you already ran `db push` with the same Neon DB from your machine, you’re good.)

---

## Step 5: 7 PM Daily Cron (Close Groups)

You need something to call your API every day at **7:01 PM (IST)**.

### Option A: Vercel Cron (Pro plan)

If you’re on Vercel Pro, add `vercel.json` in the project root with:

```json
{
  "crons": [{
    "path": "/api/cron/close-groups",
    "schedule": "31 13 * * *"
  }]
}
```

`31 13 * * *` = 1:31 PM UTC = 7:01 PM IST. Set **CRON_SECRET** in Vercel; the cron runner will need to send `Authorization: Bearer <CRON_SECRET>` (you may need to confirm Vercel’s cron auth in their docs).

### Option B: Free external cron (no Pro)

Use [cron-job.org](https://cron-job.org) (free):

1. Create an account and a new cron job.
2. **URL:** `https://yourdomain.com/api/cron/close-groups`
3. **Schedule:** Daily at 7:01 PM — choose timezone **Asia/Kolkata** and set 19:01.
4. **Request headers:**  
   `Authorization: Bearer YOUR_CRON_SECRET`
5. Save. The site will be called every day and close due groups.

---

## Checklist Before Go-Live

- [ ] `DATABASE_URL` = Neon (or other production PostgreSQL)
- [ ] `ADMIN_SECRET` = strong secret, not default
- [ ] `UPI_VPA` and `UPI_PAYEE_NAME` set
- [ ] `CRON_SECRET` set and used in cron (Vercel or cron-job.org)
- [ ] Production DB: `npx prisma db push` and `npx prisma db seed` (if needed)
- [ ] Domain pointed to Vercel and SSL working
- [ ] Test: join a group, pay via UPI QR, confirm in Admin

---

## If You Outgrow Free Tiers

- **Vercel:** Upgrade to Pro ($20/mo) for more bandwidth and Vercel Cron.
- **Neon:** Upgrade for more storage and connections.
- **Razorpay:** Add for automatic payment verification and better reporting.

---

## Alternative: Railway (All-in-One)

If you prefer one platform:

1. [railway.app](https://railway.app) — Sign in with GitHub.
2. New Project → Deploy from GitHub (your repo).
3. Add **PostgreSQL** from Railway (same project).
4. Set env vars: `DATABASE_URL` (Railway gives this), `ADMIN_SECRET`, `UPI_VPA`, `UPI_PAYEE_NAME`, `CRON_SECRET`.
5. Use cron-job.org (as above) to hit your Railway URL for `/api/cron/close-groups`.

Railway free tier has a $5 credit; then pay-as-you-go. Good if you want app + DB in one place.
