#!/bin/bash

# GymMatch - Database Migration Script
# Run this to apply the social feed system migration

echo "🚀 Starting database migration..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Run migration
echo "📝 Applying migration: 20250112_social_feed_system.sql"
echo ""

# Option 1: Using Supabase CLI (if linked to project)
# supabase db push

# Option 2: Manual SQL execution
echo "Please run this SQL file in your Supabase dashboard:"
echo "supabase/migrations/20250112_social_feed_system.sql"
echo ""
echo "Or use the Supabase CLI:"
echo "  supabase db push"
echo ""

echo "✅ Migration instructions displayed"
echo ""
echo "After running the migration, you can proceed with the API implementation."
