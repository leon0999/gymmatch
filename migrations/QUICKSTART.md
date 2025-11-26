# Quick Start: Apply Workout Focus Migration

## 🚀 5-Minute Setup

### Step 1: Copy SQL Script

Open this file:
```
migrations/001_add_workout_focus_columns.sql
```

Copy lines 13-44 (the SQL between `BEGIN;` and `COMMIT;`)

### Step 2: Apply in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your **GymMatch** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the SQL script
6. Click **Run** (or press Cmd+Enter)

### Step 3: Verify Success

Run this verification query:
```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('today_workout_focus', 'workout_focus_updated_at');
```

**Expected output:**
```
column_name              | data_type                   | is_nullable
-------------------------+-----------------------------+------------
today_workout_focus      | text                        | YES
workout_focus_updated_at | timestamp with time zone    | YES
```

✅ If you see 2 rows, migration successful!

### Step 4: Restart Dev Server

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test Application

1. Open: http://localhost:3000/discover
2. You should see: "What's your focus today?" popup
3. Select a workout focus (e.g., "Chest")
4. Click - it should save and close
5. Refresh page - popup should NOT appear again (saved!)

---

## ✅ Success Checklist

- [ ] SQL migration executed without errors
- [ ] Verification query shows 2 columns
- [ ] Dev server restarted
- [ ] Popup appears on `/discover` page
- [ ] Can select and save workout focus
- [ ] Popup doesn't appear again after saving

---

## ❌ If Something Goes Wrong

### Popup Still Not Appearing?

**Check browser console** (F12 → Console):
- Look for errors related to Supabase or database
- If you see "column does not exist", migration didn't apply

**Check Supabase logs**:
1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for errors in the last 5 minutes

**Quick Fix**:
```bash
# Clear browser cache
# Restart dev server
npm run dev

# Try in incognito mode
```

### Migration Failed?

**Error: "column already exists"**
- Column was added manually before
- ✅ This is OK! Just verify columns exist

**Error: "relation does not exist"**
- Check you're in correct Supabase project
- Verify `profiles` table exists

**Error: "permission denied"**
- You need admin access to Supabase project
- Ask project owner for access

---

## 🔄 Need to Rollback?

If you need to undo the migration:

1. Open: `migrations/000_rollback_workout_focus_columns.sql`
2. Copy the SQL (lines 13-30)
3. Run in Supabase SQL Editor
4. ⚠️ **Warning**: This deletes all workout focus data!

---

## 📞 Need Help?

1. Check full docs: `migrations/README.md`
2. Check database types: `src/lib/database.types.ts` (already updated ✅)
3. Check discover page: `src/app/discover/page.tsx` (lines 88-115)

---

**Estimated Time**: 5 minutes
**Difficulty**: Easy
**Risk**: Very Low (nullable columns, backward compatible)
