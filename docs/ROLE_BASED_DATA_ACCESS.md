# Role-Based Data Access

## Overview

The system now implements proper role-based data access control to ensure:
- **Sales persons** only see their own transactions and returns
- **Admins** see all transactions and returns in the tenant
- **Inventory** is shared across all users in the tenant (stock changes affect everyone)
- **Real-time updates** via RLS policies

## Data Access Rules

### Products & Inventory
✅ **Shared across all users in tenant**
- All users can view products
- Stock quantities are shared
- When any user makes a sale, stock reduces for everyone
- Only admins can create/edit/delete products

### Transactions
📊 **Role-based filtering:**
- **Admins**: See ALL transactions in the tenant
- **Sales Persons**: See ONLY their own transactions (created_by = their user_id)

### Returns
🔄 **Role-based filtering:**
- **Admins**: See ALL returns in the tenant
- **Sales Persons**: See ONLY their own returns (created_by = their user_id)

### Customers
👥 **Shared across all users in tenant**
- All users can view and create customers
- Customer data is shared across the tenant

## Implementation Details

### RLS Policies Applied

#### Transactions
```sql
CREATE POLICY "Users can view transactions based on role" ON transactions
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Admins see all
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' AND tenant_id = transactions.tenant_id)
      OR
      -- Sales persons see only their own
      created_by = auth.uid()
    )
  );
```

#### Transaction Items
```sql
CREATE POLICY "Users can view transaction items based on role" ON transaction_items
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' AND tenant_id = transaction_items.tenant_id)
      OR
      transaction_id IN (SELECT id FROM transactions WHERE created_by = auth.uid())
    )
  );
```

#### Returns & Return Items
Similar policies applied to `returns` and `return_items` tables.

### Code Changes

#### `lib/services/transactions.ts`
- Added `userId` filter parameter
- Automatically filters by user when provided

#### `hooks/useTransactions.ts`
- Automatically adds `userId` filter for sales persons
- Admins get no filter (see all transactions)

```typescript
const enhancedFilters = {
  ...filters,
  userId: user?.role === 'sales_person' ? user.id : undefined,
}
```

## Real-Time Behavior

### When a Sale is Made
1. ✅ Transaction is created with `created_by = user_id`
2. ✅ Stock quantity is reduced in products table
3. ✅ Stock history is recorded
4. ✅ All users see updated stock quantities immediately (via RLS)
5. ✅ Only the creating user (or admins) can see the transaction

### When a Return is Processed
1. ✅ Return is created with `created_by = user_id`
2. ✅ Stock quantity is increased in products table
3. ✅ Stock history is recorded
4. ✅ All users see updated stock quantities immediately
5. ✅ Only the creating user (or admins) can see the return

## Testing

### Test Scenario 1: Sales Person Makes a Sale
1. Login as sales person (sales@test.com)
2. Make a sale in POS
3. Check transactions page - should see only this sale
4. Check product inventory - stock should be reduced
5. Login as admin - should see the sale in transactions

### Test Scenario 2: Admin Views All Sales
1. Login as admin (demo@restaurant.com)
2. Check transactions page - should see ALL sales from all users
3. Can filter, search, and view details of any transaction

### Test Scenario 3: Shared Inventory
1. Login as sales person A
2. Make a sale of Product X (stock: 100 → 99)
3. Login as sales person B
4. View Product X - should show stock: 99
5. Make another sale of Product X (stock: 99 → 98)
6. Login as admin - should see stock: 98

## Security Notes

✅ **RLS Enforced**: All data access is enforced at the database level via Row Level Security
✅ **No Data Leakage**: Sales persons cannot see other users' transactions even if they try to query directly
✅ **Tenant Isolation**: Users can only see data from their own tenant
✅ **Audit Trail**: All transactions and returns track `created_by` for accountability

## Migrations Applied

1. `filter_transactions_by_user_role` - Transaction filtering by role
2. `filter_returns_by_user_role` - Return filtering by role
3. `fix_returns_policies_final` - Final return policies cleanup

## Benefits

1. **Privacy**: Sales persons can't see each other's sales performance
2. **Accountability**: Each transaction is tied to a specific user
3. **Shared Resources**: Inventory is managed centrally
4. **Real-time**: Stock changes are immediately visible to all users
5. **Scalable**: Works for any number of users in a tenant
