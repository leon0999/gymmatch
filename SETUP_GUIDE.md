# 🚀 GymMatch - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- A Stripe account (for payments)
- A Mapbox account (for maps)

---

## 🔧 Step-by-Step Setup

### 1. Clone & Install Dependencies

```bash
cd /Users/user/Desktop/gymmatch
npm install
```

**Installed packages:**
- @supabase/supabase-js
- zustand (state management)
- mapbox-gl (location services)
- @stripe/stripe-js (payments)

---

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: GymMatch
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users (e.g., US East)
4. Wait 2-3 minutes for project to initialize

---

### 3. Set Up Supabase Database

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your project dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy the entire contents of `SUPABASE_SCHEMA.sql`
5. Paste into the query editor
6. Click **Run**
7. Verify all tables were created (should see 10+ tables)

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

### 4. Enable PostGIS Extension

PostGIS is required for location-based queries (finding nearby users).

1. In Supabase Dashboard, go to **Settings** → **Database** → **Extensions**
2. Search for "postgis"
3. Toggle **ON** for postgis extension
4. Confirm installation

---

### 5. Create Storage Bucket

For profile photos:

1. Go to **Storage** in left sidebar
2. Click **New Bucket**
3. Name: `profile-photos`
4. Public: **Yes** (enable public access)
5. File size limit: **5MB**
6. Allowed MIME types:
   - image/jpeg
   - image/png
   - image/webp

---

### 6. Get Supabase API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon Key** (public key, safe for client-side)
   - **Service Role Key** (optional, for admin operations)

---

### 7. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Open .env.local and fill in your values
nano .env.local
```

**Minimum required** (to get started):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For full functionality**, also add:

```env
# Mapbox (for location picker)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
```

---

### 8. Get Mapbox API Key

1. Go to [mapbox.com](https://account.mapbox.com/)
2. Sign up for free account
3. Go to **Access Tokens**
4. Copy your **Default Public Token** (starts with `pk.`)
5. Paste into `.env.local` as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

**Free tier includes:**
- 50,000 map loads/month
- 100,000 geocoding requests/month
- More than enough for MVP!

---

### 9. Set Up Stripe (Optional - for Premium)

#### Create Stripe Account

1. Go to [stripe.com](https://dashboard.stripe.com/register)
2. Sign up (use test mode for development)
3. Go to **Developers** → **API Keys**
4. Copy:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

#### Create Products & Prices

1. Go to **Products** → **Add Product**

**Monthly Premium:**
- Name: GymMatch Premium (Monthly)
- Description: Unlimited swipes, see who liked you, advanced filters
- Price: $9.99/month
- Billing: Recurring
- Copy the **Price ID** (starts with `price_`)

**Yearly Premium:**
- Name: GymMatch Premium (Yearly)
- Description: Save 33% with annual billing
- Price: $79.99/year
- Billing: Recurring
- Copy the **Price ID**

Add these Price IDs to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_xxxxx
```

---

### 10. Test Your Setup

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

**Expected output:**

```
✓ Compiled /src/app/page.tsx in 1.2s
✓ Ready on http://localhost:3000
```

---

## 🧪 Verify Database Connection

Create a test file to verify everything works:

```typescript
// test-supabase.ts
import { supabase } from './src/lib/supabase';

async function testConnection() {
  const { data, error } = await supabase.from('profiles').select('count');

  if (error) {
    console.error('❌ Connection failed:', error);
  } else {
    console.log('✅ Supabase connected!', data);
  }
}

testConnection();
```

Run:

```bash
npx tsx test-supabase.ts
```

---

## 📂 Project Structure

After setup, your project should look like:

```
gymmatch/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── page.tsx         # Landing page
│   │   ├── layout.tsx       # Root layout
│   │   └── api/             # API routes (to be created)
│   ├── components/          # React components (to be created)
│   ├── lib/
│   │   ├── types.ts         # ✅ TypeScript interfaces
│   │   ├── constants.ts     # ✅ App constants
│   │   ├── supabase.ts      # ✅ Supabase client
│   │   └── matching.ts      # ✅ Matching algorithm
│   └── styles/
│       └── globals.css
├── public/                  # Static assets
├── .env.local              # ✅ Environment variables
├── .env.example            # ✅ Template
├── SUPABASE_SCHEMA.sql     # ✅ Database schema
├── package.json
└── README.md
```

**✅ = Already created**
**🔜 = Next steps**

---

## 🎯 Next Steps (Development Plan)

### Day 1-2: Onboarding Flow
- [ ] Create `/app/onboarding/page.tsx`
- [ ] Step 1: Basic info (name, age, gender, location)
- [ ] Step 2: Fitness profile (level, goals, styles)
- [ ] Step 3: Schedule selector
- [ ] Step 4: Photos & bio
- [ ] Step 5: Preferences
- [ ] Save profile to Supabase

### Day 3-4: Matching & Swipe UI
- [ ] Create `/app/discover/page.tsx`
- [ ] Fetch matches using matching algorithm
- [ ] Build swipeable card component
- [ ] Handle like/pass actions
- [ ] Check for mutual matches
- [ ] Show match notification

### Day 5-6: Chat & Workouts
- [ ] Create `/app/matches/page.tsx` (list of matches)
- [ ] Create `/app/chat/[id]/page.tsx` (real-time chat)
- [ ] Implement Supabase Realtime subscriptions
- [ ] Build workout invite system
- [ ] Calendar integration

### Day 7: Premium & Launch
- [ ] Create `/app/premium/page.tsx`
- [ ] Integrate Stripe Checkout
- [ ] Handle webhooks
- [ ] Deploy to Vercel
- [ ] Test end-to-end
- [ ] Launch! 🚀

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

**Solution:** Ensure `.env.local` exists and contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

Restart dev server after adding env vars.

---

### Error: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
npm install @supabase/supabase-js
```

---

### Error: "PostGIS extension not found"

**Solution:**
1. Go to Supabase Dashboard
2. Settings → Database → Extensions
3. Enable "postgis" extension
4. Re-run `SUPABASE_SCHEMA.sql`

---

### Error: "CORS error" when calling Supabase

**Solution:**
- Check that your Supabase URL is correct
- Verify you're using `NEXT_PUBLIC_` prefix for client-side variables
- Check Supabase Dashboard → Authentication → URL Configuration

---

### Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
PORT=3001 npm run dev
```

---

## 📊 Database Schema Summary

Tables created (10 total):

1. **profiles** - User profiles with location, fitness info, preferences
2. **swipes** - Track user swipes (like/pass)
3. **matches** - Mutual matches between users
4. **messages** - Chat messages between matches
5. **workout_invites** - Workout invitations
6. **scheduled_workouts** - Confirmed workout sessions
7. **swipe_quotas** - Daily swipe limits (3 for free, unlimited for premium)
8. **subscriptions** - Premium subscription status
9. **user_stats** - User analytics (swipes, matches, etc.)
10. **notifications** - Push notifications

---

## 🔒 Security Checklist

- [x] Row Level Security (RLS) enabled on all tables
- [x] Users can only access their own data
- [x] API keys in `.env.local` (not committed to git)
- [ ] Set up Supabase email confirmation
- [ ] Configure CORS in production
- [ ] Add rate limiting to API routes
- [ ] Enable Stripe webhook signature verification

---

## 📈 Monitoring & Analytics

### Recommended Tools

1. **Vercel Analytics** (free for deployment)
2. **Supabase Dashboard** (database metrics)
3. **Stripe Dashboard** (payment metrics)
4. **Google Analytics** (user behavior)
5. **Sentry** (error tracking)

---

## 💰 Cost Estimation (Monthly)

**Development (Free):**
- Supabase: Free tier (50,000 rows, 2GB storage)
- Stripe: Free (testing mode)
- Mapbox: Free (50k requests)
- Vercel: Free (hobby plan)
- **Total: $0/month**

**Production (500 users):**
- Supabase: Free tier (sufficient)
- Stripe: 2.9% + $0.30 per transaction
- Mapbox: Free tier (sufficient)
- Vercel: Free tier (sufficient)
- **Total: ~$0/month (only Stripe fees on premium subscriptions)**

**Production (5,000 users):**
- Supabase: $25/month (Pro plan)
- Stripe: 2.9% + $0.30 per transaction
- Mapbox: Free tier
- Vercel: $20/month (Pro plan for better performance)
- **Total: ~$45/month + Stripe fees**

**At scale (50,000 users):**
- Supabase: $599/month (Team plan)
- Stripe: 2.9% + $0.30
- Mapbox: $5/month (custom)
- Vercel: $150/month (custom)
- **Total: ~$754/month + Stripe fees**

**Revenue (at 25% premium conversion):**
- 50,000 users × 25% × $9.99 = **$124,875/month**
- **Net profit: ~$124,000/month** 🚀

---

## 🎓 Learning Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ✅ Setup Complete!

You now have:
- ✅ Next.js 14 project initialized
- ✅ Supabase database with all tables
- ✅ TypeScript interfaces defined
- ✅ Matching algorithm implemented (100-point system)
- ✅ Environment variables configured
- ✅ Development server running

**Ready to start building features!** 🎉

---

**Questions or issues?** Check the troubleshooting section or create an issue in the repo.
