# Run locally → improve → push

## Option A: Local database (recommended — safe, no prod data)

1. **Start local Postgres**
   ```powershell
   cd "c:\Users\Home\Desktop\NewIdea\checkmyluck"
   docker compose up -d
   ```

2. **Use local DB in `.env`**  
   Set in your `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/checkmyluck"
   ```
   (Keep your real `ADMIN_SECRET`, `UPI_VPA`, `UPI_PAYEE_NAME` for testing.)

3. **Create tables and seed**
   ```powershell
   npx prisma db push
   npx prisma db seed
   ```

4. **Run the app**
   ```powershell
   npm run dev
   ```
   Open **http://localhost:3000**

5. **When done**  
   Make your code changes, then push:
   ```powershell
   git add .
   git commit -m "Your change description"
   git push origin main
   ```
   Vercel will deploy automatically.

---

## Option B: Same DB as production (Neon)

- Keep your current `.env` (Neon connection string).
- Run `npm run dev` — you’ll hit the same data as production.
- Use only for small, careful tests; avoid for big or risky changes.

---

## Switch back to production DB later

If you switched to local (Option A) and want to run Prisma against production again (e.g. `db push` after schema change):

- Temporarily set `DATABASE_URL` in `.env` to your **Neon pooled** URL, run `npx prisma db push`, then switch back to local if you prefer.
