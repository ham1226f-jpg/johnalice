# Setting Up Mumbi POS on a New Supabase Instance

This guide will help you recreate the complete Mumbi POS database schema on a fresh Supabase project, including full multi-store support.

## Prerequisites

- A Supabase account (free tier works fine)
- A new Supabase project created

## Quick Setup (Recommended)

### Step 1: Apply the Complete Schema

1. Log in to your Supabase project at [https://supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `complete_schema_with_multistore.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

This single file includes:
- ✅ All tables with multi-store support
- ✅ All indexes for performance
- ✅ All functions and triggers
- ✅ Complete RLS policies with store-based access control
- ✅ Auto-generated transaction/PO/return numbers
- ✅ Tour/onboarding system

### Step 2: Create Your First Tenant

```sql
INSERT INTO tenants (name, settings)
VALUES ('Your Business Name', '{"currency": "KES", "low_stock_threshold": 10}')
RETURNING id;
```

Copy the returned `id` - you'll need it for the next steps.

### Step 3: Create a Default Store

```sql
INSERT INTO stores (tenant_id, name)
VALUES ('[TENANT_ID_FROM_STEP_2]', 'Main Store')
RETURNING id;
```

Copy the returned `id` - you'll need it for sales staff assignments.

### Step 4: Create Admin User

1. Go to **Authentication > Users** in Supabase Dashboard
2. Click **Add User**
3. Enter:
   - Email: `admin@yourbusiness.com`
   - Password: Choose a strong password
   - Auto Confirm User: ✅ (check this)
4. Click **Create User**
5. Copy the user's UUID

### Step 5: Link Admin User to Tenant

```sql
INSERT INTO users (id, tenant_id, email, full_name, role, store_id)
VALUES (
  '[AUTH_USER_ID_FROM_STEP_4]',
  '[TENANT_ID_FROM_STEP_2]',
  'admin@yourbusiness.com',
  'Admin User',
  'admin',
  NULL  -- Admins can access all stores
);
```

### Step 6: (Optional) Create Sales Staff

For each sales person:

1. Create auth user in **Authentication > Users**
2. Link to tenant with store assignment:

```sql
INSERT INTO users (id, tenant_id, email, full_name, role, store_id)
VALUES (
  '[AUTH_USER_ID]',
  '[TENANT_ID]',
  'sales@yourbusiness.com',
  'Sales Person Name',
  'sales_person',
  '[STORE_ID_FROM_STEP_3]'  -- Assign to specific store
);
```

### Step 7: Update Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

Get these values from:
- Supabase Dashboard > Settings > API

## Multi-Store Architecture

### Access Control

**Admin Users** (`role = 'admin'`):
- `store_id` is `NULL`
- Can access ALL stores in their tenant
- Application layer provides store selector
- Can create, edit, and delete stores
- Can manage all products, transactions, customers across all stores

**Sales Staff** (`role = 'sales_person'`):
- `store_id` is assigned to a specific store
- Can ONLY access data from their assigned store
- Cannot see or access other stores' data
- Cannot create or manage stores
- RLS policies enforce store isolation at database level

### Store-Scoped Tables

These tables have `store_id` and enforce store-based access:
- `products` - Each product belongs to one store
- `transactions` - Sales are tracked per store
- `customers` - Customer records per store
- `expenses` - Expenses tracked per store
- `purchase_orders` - POs managed per store
- `returns` - Returns processed per store
- `stock_history` - Stock movements per store

### Creating Additional Stores

Admins can create new stores:

```sql
INSERT INTO stores (tenant_id, name, settings)
VALUES (
  '[YOUR_TENANT_ID]',
  'Branch Store Name',
  '{"currency": "KES"}'
)
RETURNING id;
```

Then assign sales staff to the new store:

```sql
UPDATE users 
SET store_id = '[NEW_STORE_ID]'
WHERE id = '[SALES_PERSON_USER_ID]';
```

## Verification

Run these queries to verify your setup:

```sql
-- Check tenant
SELECT * FROM tenants;

-- Check stores
SELECT 
  s.name as store_name,
  t.name as tenant_name,
  s.created_at
FROM stores s
JOIN tenants t ON t.id = s.tenant_id;

-- Check users
SELECT 
  u.full_name,
  u.email,
  u.role,
  s.name as assigned_store,
  t.name as tenant_name
FROM users u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN stores s ON s.id = u.store_id
ORDER BY u.role, u.full_name;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Check policies
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Incremental Migration (Alternative)

If you prefer to apply migrations incrementally, run them in this order:

1. `schema.sql` - Base schema
2. `create_stores_table.sql` - Add stores table
3. `add_store_id_columns.sql` - Add store_id to tables
4. `migrate_data_to_stores.sql` - Migrate existing data (if any)
5. `update_rls_policies_for_stores.sql` - Update RLS for multi-store

However, the `complete_schema_with_multistore.sql` file is recommended as it includes everything in one go.

## Features Included

### Auto-Generated Numbers
- Transaction numbers: `TXN-YYYYMMDD-0001`
- Purchase order numbers: `PO-YYYYMMDD-0001`
- Return numbers: `RET-YYYYMMDD-0001`

### Default Expense Categories
Automatically created for each tenant:
- Utilities
- Rent
- Supplies
- Salaries
- Miscellaneous

### Security
- Row Level Security (RLS) enabled on all tables
- Multi-tenant isolation
- Store-based access control
- Role-based permissions (admin vs sales_person)

### Performance
- Comprehensive indexes on all foreign keys
- Composite indexes for common queries
- Full-text search on products

### Audit Trail
- `created_at` and `updated_at` timestamps
- Automatic timestamp updates via triggers
- Expense audit log for tracking changes

## Troubleshooting

### "relation does not exist" errors
- Make sure you ran the complete schema file
- Check that you're in the correct Supabase project

### "permission denied" errors
- Verify RLS policies are created
- Check that your user is properly linked to a tenant
- Ensure the user has the correct role

### Sales staff can't see any data
- Verify their `store_id` is set correctly
- Check that data exists for their assigned store
- Confirm RLS policies are enabled

### Admin can't access certain features
- Verify their `role` is set to 'admin'
- Check that `store_id` is NULL for admin users

## Next Steps

After setup:
1. Log in to the application with your admin credentials
2. Create products for your store(s)
3. Add customers
4. Start processing transactions
5. Create additional stores if needed
6. Invite sales staff and assign them to stores

## Support

For issues or questions:
- Check the migration files in `migrations/` directory
- Review the `README.md` in the migrations folder
- Consult the application documentation

## Database Backup

Always backup your database before making changes:
1. Go to Supabase Dashboard > Database > Backups
2. Enable automatic backups (recommended)
3. Create manual backup before major changes
