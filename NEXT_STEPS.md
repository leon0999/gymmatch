# ✅ Next Steps: Apply Workout Focus Migration

## 🎯 What You Need to Do Now

The migration files are ready! Now you just need to apply them to your Supabase database.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard (1 minute)

1. Go to: **https://supabase.com/dashboard**
2. Login with your account
3. Select your **GymMatch** project
4. Click **"SQL Editor"** in the left sidebar
5. Click **"New Query"** button

### Step 2: Copy the SQL Script (30 seconds)

**Option A - From This Repository:**
1. Open: `/Users/user/Desktop/gymmatch/migrations/001_add_workout_focus_columns.sql`
2. Copy lines **13 to 44** (everything between `BEGIN;` and `COMMIT;`)

**Option B - From GitHub:**
1. Go to: https://github.com/leon0999/gymmatch/blob/main/migrations/001_add_workout_focus_columns.sql
2. Copy the SQL code

### Step 3: Run the Migration (30 seconds)

1. **Paste** the SQL into Supabase SQL Editor
2. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)
3. Wait for success message: ✅ "Success. No rows returned"

### Step 4: Verify Success (30 seconds)

Run this verification query in the same SQL Editor:

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

**Expected Result:**
```
column_name              | data_type                   | is_nullable
-------------------------+-----------------------------+------------
today_workout_focus      | text                        | YES
workout_focus_updated_at | timestamp with time zone    | YES
```

✅ If you see **2 rows**, migration is successful!

### Step 5: Test the Application (2 minutes)

1. **Restart your dev server:**
   ```bash
   # Stop: Ctrl+C
   # Start:
   npm run dev
   ```

2. **Open discover page:**
   ```
   http://localhost:3000/discover
   ```

3. **You should see:**
   - ✅ "What's your focus today?" popup appears
   - ✅ 8 workout options displayed (Chest, Back, Legs, etc.)

4. **Select a focus:**
   - Click any option (e.g., "Chest")
   - ✅ Popup should close automatically
   - ✅ Matches should load

5. **Refresh page:**
   - ✅ Popup should NOT appear again (already set today)

6. **Check browser console (F12):**
   - ✅ No errors related to database columns

---

## 🎉 Success Criteria

You'll know it worked when:

- ✅ SQL migration executed without errors
- ✅ Verification query returns 2 columns
- ✅ Popup appears on `/discover` page
- ✅ Can select and save workout focus
- ✅ Popup doesn't appear again after selecting
- ✅ No console errors

---

## ⏱️ Time Estimate

- **Step 1** (Open Supabase): 1 minute
- **Step 2** (Copy SQL): 30 seconds
- **Step 3** (Run migration): 30 seconds
- **Step 4** (Verify): 30 seconds
- **Step 5** (Test app): 2 minutes

**Total: 5 minutes** ⚡

---

## ✅ Checklist

Use this to track your progress:

- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied migration SQL script
- [ ] Ran migration in Supabase
- [ ] Ran verification query
- [ ] Saw 2 rows returned (columns exist)
- [ ] Restarted dev server
- [ ] Opened http://localhost:3000/discover
- [ ] Saw "What's your focus today?" popup
- [ ] Selected a workout focus
- [ ] Popup closed automatically
- [ ] Matches loaded successfully
- [ ] Refreshed page (popup didn't appear again)
- [ ] Checked browser console (no errors)

**All checked?** 🎉 Migration successful!

---

**Last Updated**: 2025-11-26
**Status**: Ready to Apply ✅
**Difficulty**: Easy
**Time**: 5 minutes
