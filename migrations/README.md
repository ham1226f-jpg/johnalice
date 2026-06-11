# Database Migrations

This directory contains database migration scripts for the Restaurant POS System.

## How to Apply Migrations

### Using Supabase Dashboard

1. Log in to your Supabase project at [https://supabase.com](https://supabase.com)
2. Go to the **SQL Editor** section
3. Copy the contents of the migration file you want to apply
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Available Migrations

#### `add_served_by_to_transactions.sql`

**Purpose**: Adds a "Served By" field to track which user (admin or sales person) served each customer.

**Features**:
- Adds `served_by` column to the `transactions` table
- Creates a foreign key reference to the `users` table
- Backfills existing transactions to use the `created_by` user
- Adds an index for better query performance

**When to apply**: Before using the "Served By" feature in the POS checkout

**Safe to re-run**: Yes, the migration includes `IF NOT EXISTS` checks where applicable

## Migration Order

Apply migrations in the order they appear in this directory (by filename or date if applicable).

## Rollback

To rollback the served_by migration, run:

```sql
-- Remove the index
DROP INDEX IF EXISTS idx_transactions_served_by;

-- Remove the column
ALTER TABLE transactions DROP COLUMN IF EXISTS served_by;
```

## Testing Migrations

It's recommended to test migrations on a development or staging environment before applying them to production.
