# Store Management Service

This service provides CRUD operations for managing stores in the multi-store POS system.

## Overview

The store management service implements the core functionality for creating, reading, updating, and deleting stores. It enforces business rules such as store name uniqueness within a tenant and deletion protection when stores have associated data.

## Prerequisites

Before using this service, ensure the following database migrations have been applied:

1. `create_stores_table.sql` - Creates the stores table
2. `add_store_id_columns.sql` - Adds store_id columns to existing tables
3. `migrate_data_to_stores.sql` - Migrates existing data to default stores
4. `update_rls_policies_for_stores.sql` - Updates RLS policies for store-based access control

After running migrations, regenerate Supabase types to resolve TypeScript errors:
```bash
npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

## API Reference

### `getStoresForUser(tenantId, userId, userRole)`

Retrieves all stores available to a user based on their role.

**Parameters:**
- `tenantId` (string): The tenant identifier
- `userId` (string): The user identifier
- `userRole` (UserRole): The user's role ('admin' or 'sales_person')

**Returns:** `Promise<Store[]>`

**Behavior:**
- **Admins**: Returns all stores in the tenant
- **Sales persons**: Returns only their assigned store

**Throws:**
- Error if sales person has no assigned store

**Example:**
```typescript
const stores = await getStoresForUser('tenant-123', 'user-456', 'admin')
```

### `getUserStores(tenantId, userId, userRole)`

Alias for `getStoresForUser` with a more intuitive name. Retrieves all stores available to a user based on their role.

**Parameters:**
- `tenantId` (string): The tenant identifier
- `userId` (string): The user identifier
- `userRole` (UserRole): The user's role ('admin' or 'sales_person')

**Returns:** `Promise<Store[]>`

**Example:**
```typescript
const stores = await getUserStores('tenant-123', 'user-456', 'admin')
```

### `canAccessStore(userId, storeId, userRole)`

Validates whether a user has permission to access a specific store.

**Parameters:**
- `userId` (string): The user identifier
- `storeId` (string): The store identifier
- `userRole` (UserRole): The user's role ('admin' or 'sales_person')

**Returns:** `Promise<boolean>`

**Behavior:**
- **Admins**: Can access all stores within their tenant
- **Sales persons**: Can only access their assigned store
- Returns `false` if store belongs to a different tenant

**Throws:**
- Error if user or store not found

**Example:**
```typescript
const canAccess = await canAccessStore('user-456', 'store-789', 'sales_person')
if (canAccess) {
  // Proceed with store operation
} else {
  // Show access denied error
}
```

### `createStore(tenantId, input)`

Creates a new store with the specified name and settings.

**Parameters:**
- `tenantId` (string): The tenant identifier
- `input` (CreateStoreInput): Store creation data
  - `name` (string): Store name (required)
  - `settings` (object, optional): Store-specific settings

**Returns:** `Promise<Store>`

**Validation:**
- Store name must be unique within the tenant

**Throws:**
- Error if store name already exists in the tenant

**Example:**
```typescript
const store = await createStore('tenant-123', {
  name: 'Downtown Store',
  settings: {
    low_stock_threshold: 10,
    currency: 'USD',
    tax_rate: 0.08
  }
})
```

### `updateStore(storeId, updates)`

Updates an existing store's name and/or settings.

**Parameters:**
- `storeId` (string): The store identifier
- `updates` (UpdateStoreInput): Fields to update
  - `name` (string, optional): New store name
  - `settings` (object, optional): Updated settings

**Returns:** `Promise<Store>`

**Validation:**
- If updating name, validates uniqueness within tenant

**Throws:**
- Error if new name already exists in the tenant

**Example:**
```typescript
const updatedStore = await updateStore('store-789', {
  name: 'Downtown Store - Main',
  settings: { low_stock_threshold: 15 }
})
```

### `deleteStore(storeId)`

Deletes a store after validating it has no associated data.

**Parameters:**
- `storeId` (string): The store identifier

**Returns:** `Promise<void>`

**Validation:**
- Checks for associated data in:
  - users
  - products
  - transactions
  - customers
  - expenses
  - purchase_orders

**Throws:**
- Error if store has any associated data, listing the entity types and counts

**Example:**
```typescript
await deleteStore('store-789')
```

## Business Rules

### Store Name Uniqueness (Requirement 1.2)
Store names must be unique within a tenant. The service validates this constraint during both creation and updates.

### Deletion Protection (Requirement 1.5)
Stores cannot be deleted if they have associated data. The service checks all related tables and provides detailed error messages listing the dependencies.

### Role-Based Access (Requirements 2.4, 2.5, 13.2, 13.3)
- **Admins** can access all stores within their tenant
- **Sales persons** can only access their assigned store
- The `canAccessStore` function validates store access permissions before operations
- Cross-tenant access is always denied

## Error Handling

The service throws descriptive errors for common scenarios:

- **Duplicate store name**: `"Store name already exists in this tenant"`
- **Deletion with dependencies**: `"Cannot delete store: Store has associated X user(s), Y product(s)"`
- **Unassigned sales person**: `"User is not assigned to any store"`

## Testing

The service includes comprehensive unit tests covering:

- Store name uniqueness validation
- Store creation with valid data
- Store update with name uniqueness check
- Deletion protection when dependencies exist
- Successful deletion when no dependencies
- Admin access to all stores
- Sales person access to assigned store only
- Error handling for unassigned sales persons
- Store access permission validation (`canAccessStore`)
  - Admin access to any store in their tenant
  - Sales person access to assigned store
  - Sales person denied access to other stores
  - Cross-tenant access denial
- `getUserStores` as an alias for `getStoresForUser`

Run tests with:
```bash
npm test -- stores.test.ts
```

## Type Definitions

```typescript
interface Store {
  id: string
  tenant_id: string
  name: string
  settings: {
    low_stock_threshold?: number
    currency?: string
    tax_rate?: number
  }
  created_at: string
  updated_at: string
}

interface CreateStoreInput {
  name: string
  settings?: {
    low_stock_threshold?: number
    currency?: string
    tax_rate?: number
  }
}

interface UpdateStoreInput {
  name?: string
  settings?: {
    low_stock_threshold?: number
    currency?: string
    tax_rate?: number
  }
}
```

## Implementation Notes

### Type Assertions
The service uses `as any` type assertions for the 'stores' table queries. This is a temporary workaround until the Supabase types are regenerated after running the database migrations. Once the types are updated, these assertions can be removed.

### RLS Policies
The service relies on Row-Level Security (RLS) policies at the database level to enforce tenant isolation and role-based access control. The application layer provides additional validation for better error messages and user experience.

### Performance Considerations
- Store queries are indexed on `tenant_id` for efficient lookups
- Deletion validation checks use `count` queries with `head: true` to minimize data transfer
- Store list queries for admins are ordered by `created_at` for consistent results

## Related Files

- `types/index.ts` - Store type definitions
- `migrations/create_stores_table.sql` - Database schema
- `migrations/add_store_id_columns.sql` - Foreign key columns
- `migrations/migrate_data_to_stores.sql` - Data migration
- `migrations/update_rls_policies_for_stores.sql` - RLS policies
- `lib/services/stores.test.ts` - Unit tests
