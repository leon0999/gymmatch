# GymMatch Database Migrations

## Migration 001: Add Workout Focus Columns

### Overview
This migration adds two columns to the `profiles` table to support the "Today's Workout Focus" feature:
- `today_workout_focus`: Stores the user's current workout focus (chest, back, legs, etc.)
- `workout_focus_updated_at`: Tracks when the focus was last updated

### Problem Solved
Users were experiencing an issue where the "Today's Workout Popup" wasn't appearing on the discover page. This was because the required database columns were missing.

### Files
- `001_add_workout_focus_columns.sql` - Forward migration
- `000_rollback_workout_focus_columns.sql` - Rollback migration

---

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended for Production)

1. **Login to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your GymMatch project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Migration Script**
   ```sql
   -- Copy and paste the entire content of:
   -- migrations/001_add_workout_focus_columns.sql
   ```

4. **Verify Migration**
   ```sql
   -- Check columns exist
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'profiles'
     AND column_name IN ('today_workout_focus', 'workout_focus_updated_at');

   -- Expected output:
   -- today_workout_focus | text | YES
   -- workout_focus_updated_at | timestamp with time zone | YES
   ```

5. **Test Application**
   - Restart your Next.js dev server
   - Navigate to `/discover` page
   - You should see the "Today's Workout Focus" popup

### Option 2: Supabase CLI (For Local Development)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

### Option 3: Direct SQL Connection

If you have direct PostgreSQL access:

```bash
# Connect to your Supabase PostgreSQL database
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Run migration
\i /path/to/gymmatch/migrations/001_add_workout_focus_columns.sql
```

---

## Rollback Instructions

If you need to rollback this migration:

### ⚠️ WARNING
**This will permanently delete all workout focus data. Only proceed if necessary.**

1. **Backup Data First** (Optional but Recommended)
   ```sql
   -- Save workout focus data before rollback
   CREATE TABLE profiles_workout_focus_backup AS
   SELECT user_id, today_workout_focus, workout_focus_updated_at
   FROM profiles
   WHERE today_workout_focus IS NOT NULL;
   ```

2. **Run Rollback Script**
   ```sql
   -- Copy and paste the entire content of:
   -- migrations/000_rollback_workout_focus_columns.sql
   ```

3. **Verify Rollback**
   ```sql
   -- Check columns are removed
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'profiles'
     AND column_name IN ('today_workout_focus', 'workout_focus_updated_at');

   -- Expected: 0 rows
   ```

4. **Restore Data** (If needed later)
   ```sql
   -- If you need to restore after re-running migration
   UPDATE profiles p
   SET today_workout_focus = b.today_workout_focus,
       workout_focus_updated_at = b.workout_focus_updated_at
   FROM profiles_workout_focus_backup b
   WHERE p.user_id = b.user_id;
   ```

---

## Migration Details

### Columns Added

#### `today_workout_focus`
- **Type**: `text`
- **Nullable**: `YES`
- **Default**: `NULL`
- **Valid Values**: 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'any'
- **Constraint**: `profiles_today_workout_focus_check`
- **Index**: `idx_profiles_today_workout_focus` (for query performance)

#### `workout_focus_updated_at`
- **Type**: `timestamp with time zone`
- **Nullable**: `YES`
- **Default**: `NULL`
- **Index**: `idx_profiles_workout_focus_updated_at` (for filtering)

### Indexes Created

1. **idx_profiles_today_workout_focus**
   - Purpose: Optimize queries filtering by workout focus
   - Partial Index: Only indexes non-NULL values

2. **idx_profiles_workout_focus_updated_at**
   - Purpose: Optimize queries filtering by update timestamp
   - Partial Index: Only indexes non-NULL values

### Impact on Existing Data

- ✅ **Zero Data Loss**: Migration only adds columns
- ✅ **Backward Compatible**: Existing queries continue to work
- ✅ **Nullable Columns**: All existing users will have NULL values
- ✅ **No Downtime**: Can be applied on live database
- ✅ **Safe to Rollback**: Rollback script provided

---

## Testing Checklist

After applying migration:

- [ ] Migration executed successfully (no errors)
- [ ] Columns exist in `profiles` table
- [ ] Indexes created successfully
- [ ] Constraint added successfully
- [ ] TypeScript types updated (`database.types.ts`)
- [ ] Dev server restarted
- [ ] Navigate to `/discover` page
- [ ] "Today's Workout Focus" popup appears
- [ ] Can select a workout focus
- [ ] Data saves successfully
- [ ] Popup doesn't appear again today
- [ ] Discover page shows matching users

---

## Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: Column may have been added manually. Run verification query:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'today_workout_focus';
```

If it exists, skip the `ALTER TABLE ADD COLUMN` step and only add indexes/constraints.

### Issue: Popup still doesn't appear

**Checklist**:
1. ✅ Migration applied successfully
2. ✅ TypeScript types updated
3. ✅ Dev server restarted
4. ✅ Browser cache cleared
5. ✅ Check browser console for errors
6. ✅ Verify Supabase client has correct permissions

**Debug query**:
```sql
SELECT today_workout_focus, workout_focus_updated_at
FROM profiles
WHERE user_id = 'YOUR_USER_ID';
```

### Issue: Error "column does not exist"

**Solution**: Migration not applied. Follow "How to Apply Migration" steps above.

### Issue: TypeScript errors after migration

**Solution**:
1. Update `database.types.ts` file (already done)
2. Restart TypeScript server: `Cmd+Shift+P` → "Restart TS Server"
3. Rebuild project: `npm run build`

---

## Performance Considerations

### Query Performance
- Partial indexes ensure only relevant rows are indexed
- Queries filtering by `today_workout_focus` will be fast (<10ms)
- Queries checking "updated today" will use `workout_focus_updated_at` index

### Storage Impact
- `today_workout_focus`: ~10-20 bytes per user
- `workout_focus_updated_at`: 8 bytes per user
- Total: ~20-30 bytes per user
- **For 10,000 users**: ~300KB additional storage (negligible)

### Network Impact
- Additional columns in SELECT * queries: ~30 bytes per row
- Can be excluded in SELECT statements if not needed

---

## Related Files

### Frontend
- `/src/app/discover/page.tsx` - Discover page (uses these columns)
- `/src/components/TodayWorkoutPopup.tsx` - Popup component

### Backend
- `/src/lib/database.types.ts` - TypeScript types (updated)
- `/src/lib/supabase.ts` - Supabase client

### Database
- `profiles` table - Modified table
- `001_add_workout_focus_columns.sql` - Migration script
- `000_rollback_workout_focus_columns.sql` - Rollback script

---

## Next Steps

After successful migration:

1. **Monitor Application**
   - Check error logs for any issues
   - Monitor Supabase dashboard for query performance
   - Watch for user reports

2. **Optional Enhancements**
   - Add default value logic for new users
   - Create analytics query for popular workout focuses
   - Add admin panel to view workout focus distribution

3. **Future Migrations**
   - Track migration history
   - Document any schema changes
   - Keep rollback scripts updated

---

## Questions or Issues?

If you encounter any problems:

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Check application logs: Browser Console / Server Logs
3. Verify migration status with verification queries
4. Check this README for troubleshooting steps

---

**Migration Author**: GymMatch Team
**Date**: 2025-11-26
**Version**: 1.0.0
**Status**: Ready for Production ✅
