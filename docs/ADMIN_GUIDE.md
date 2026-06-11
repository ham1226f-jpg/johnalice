# Admin User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Inventory Management](#inventory-management)
4. [Point of Sale (POS)](#point-of-sale-pos)
5. [Transactions](#transactions)
6. [Purchase Orders](#purchase-orders)
7. [Returns Management](#returns-management)
8. [User Management](#user-management)

## Getting Started

### First Login
1. Navigate to your POS system URL
2. Enter your admin email and password
3. Click "Sign In"

### Dashboard Overview
After login, you'll see the admin dashboard with:
- Key performance indicators (KPIs)
- Sales trends chart
- Low stock alerts
- Quick actions

## Dashboard

### Key Metrics
- **Total Revenue**: Sum of all completed transactions
- **Total Profit**: Revenue minus product costs
- **Total Sales**: Number of transactions
- **Low Stock Items**: Products below threshold

### Date Range Filtering
- Click the date range selector
- Choose from presets: Today, Week, Month, Year
- Or select custom date range
- Charts and metrics update automatically

### Low Stock Alerts
- View products running low
- Click "Restock" to quickly adjust inventory
- Set custom thresholds per product

## Inventory Management

### Adding Products

1. Go to **Inventory** from sidebar
2. Click **Add Product** button
3. Fill in product details:
   - **SKU**: Unique product code
   - **Name**: Product name
   - **Category**: Product category
   - **Description**: Optional details
   - **Selling Price**: Customer price
   - **Cost Price**: Your cost
   - **Base Unit**: Selling unit (piece, kg, etc.)
   - **Purchase Unit**: Buying unit
   - **Conversion Ratio**: Units per purchase unit
   - **Initial Stock**: Starting quantity
   - **Low Stock Threshold**: Alert level
4. Click **Create Product**

### Editing Products

1. Find product in list
2. Click **Edit** button
3. Update fields as needed
4. Click **Update Product**

### Managing Stock

#### Restock Items
1. Click **Stock** button on product
2. Select "Restock (Add to current)"
3. Enter quantity to add
4. Provide reason (e.g., "New delivery")
5. Click **Update Stock**

#### Adjust Stock
1. Click **Stock** button on product
2. Select "Set Exact Amount"
3. Enter new total quantity
4. Provide reason (e.g., "Inventory count")
5. Click **Update Stock**

### Stock History

1. Click **History** button on product
2. View all stock changes:
   - Restocks
   - Adjustments
   - Sales
   - Returns
3. See who made changes and when
4. Navigate through pages if needed

### Archiving Products

1. Click **Archive** button on product
2. Confirm action
3. Product is hidden from active lists
4. Historical data is preserved

### Exporting Inventory

1. Click **Export CSV** button
2. File downloads with all product data
3. Open in Excel or Google Sheets
4. Use for reporting or backup

## Point of Sale (POS)

### Making a Sale

1. Go to **POS** from sidebar
2. Search for products:
   - Type product name or SKU
   - Click product to add to cart
3. Adjust quantities in cart:
   - Click + to increase
   - Click - to decrease
   - Click X to remove
4. Optional: Select customer
5. Optional: Apply discount
6. Click **Checkout**
7. Select payment method
8. For cash: Enter amount tendered
9. Click **Complete Sale**
10. Print receipt if needed

### Customer Management

#### Quick Add Customer
1. In POS, click customer dropdown
2. Click "Add New Customer"
3. Enter name, phone, email
4. Click "Create Customer"
5. Customer is auto-selected

#### View Customer History
1. Select customer in dropdown
2. View previous purchases
3. See total spent

### Applying Discounts

1. In cart, find discount section
2. Choose discount type:
   - **Percentage**: Enter % off
   - **Fixed**: Enter dollar amount
3. Discount applies to total
4. Shows in receipt

## Transactions

### Viewing Transactions

1. Go to **Transactions** from sidebar
2. See all completed sales
3. Filter by:
   - Date range (Today, Week, Month, Custom)
   - Payment method
   - Search by customer or transaction number

### Transaction Details

1. Click on any transaction
2. View complete information:
   - Transaction number
   - Date and time
   - Customer details
   - Items purchased
   - Payment method
   - Total amount
3. Actions available:
   - **Reprint Receipt**: Print again
   - **Create Return**: Start return process

### Exporting Transactions

1. Set desired date range
2. Click **Export CSV**
3. File downloads with transaction data
4. Includes all items and details

## Purchase Orders

### Creating Purchase Orders

1. Go to **Purchase Orders** from sidebar
2. Click **Create Purchase Order**
3. Fill in details:
   - **Supplier Name**: Vendor name
   - **Supplier Contact**: Phone/email
   - **Expected Delivery**: Delivery date
   - **Notes**: Additional info
4. Add items:
   - Search and select products
   - Enter quantity
   - Enter unit cost
   - Click "Add Item"
5. Review total cost
6. Click **Create Purchase Order**

### Managing PO Status

#### Draft → Ordered
1. Review PO details
2. Click **Mark as Ordered**
3. Confirm action
4. Status updates to "Ordered"

#### Ordered → Received
1. When delivery arrives
2. Click **Mark as Received**
3. Confirm action
4. Status updates to "Received"

#### Received → Completed
1. Click **Restock Inventory**
2. Review quantities
3. Adjust if needed (partial delivery)
4. Click **Confirm Restock**
5. Stock is updated
6. Status changes to "Completed"

### Filtering Purchase Orders

- Filter by status: Draft, Ordered, Received, Completed
- Filter by date range
- Search by supplier name or PO number

## Returns Management

### Viewing Returns

1. Go to **Returns** from sidebar
2. See all return requests
3. Filter by status:
   - **Pending**: Awaiting approval
   - **Approved**: Accepted and processed
   - **Rejected**: Declined

### Approving Returns

1. Click on pending return
2. Review details:
   - Original transaction
   - Items being returned
   - Reason for return
   - Customer information
3. Decide action:
   - **Approve**: Accept return, restore stock
   - **Reject**: Decline return

#### To Approve
1. Click **Approve & Restore Stock**
2. Confirm action
3. Stock quantities are restored
4. Return marked as approved

#### To Reject
1. Click **Reject**
2. Confirm action
3. Return marked as rejected
4. No stock changes

## User Management

### Adding Users

1. Go to **Users** from sidebar
2. Click **Add User**
3. Fill in details:
   - **Full Name**: User's name
   - **Email**: Login email
   - **Password**: Initial password (min 8 chars)
   - **Role**: Admin or Sales Person
4. Click **Create User**
5. Share credentials with user

### User Roles

#### Admin
- Full system access
- Can manage inventory
- Can view dashboard
- Can manage users
- Can approve returns
- Can manage purchase orders

#### Sales Person
- Access to POS
- Can view transactions
- Can create returns
- Cannot manage inventory
- Cannot view dashboard
- Cannot manage users

### Editing Users

1. Find user in list
2. Click **Edit**
3. Update name or role
4. Click **Update User**
5. Note: Email cannot be changed

### Changing Passwords

#### Change Another User's Password (Admin)
1. Click **Password** button on user
2. Enter new password
3. Confirm password
4. Click **Change Password**
5. Inform user of new password

#### Change Your Own Password
1. Click **Password** on your account
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click **Change Password**

### Deleting Users

1. Click **Delete** button on user
2. Confirm deletion
3. User is removed
4. Note: Cannot delete last admin user

## Best Practices

### Daily Tasks
- [ ] Check dashboard for low stock
- [ ] Review pending returns
- [ ] Process received purchase orders
- [ ] Export daily transactions

### Weekly Tasks
- [ ] Review sales trends
- [ ] Adjust stock levels
- [ ] Create purchase orders for low stock
- [ ] Review user activity

### Monthly Tasks
- [ ] Export full inventory report
- [ ] Review profit margins
- [ ] Audit user accounts
- [ ] Backup transaction data

## Tips & Tricks

1. **Keyboard Shortcuts**: Use Tab to navigate forms quickly
2. **Bulk Actions**: Export data to Excel for bulk updates
3. **Stock Alerts**: Set realistic thresholds based on sales velocity
4. **Customer Data**: Collect customer info for better insights
5. **Regular Backups**: Export data regularly for safety
6. **User Training**: Train staff on their specific roles
7. **Mobile Access**: Install as PWA on tablets for mobility

## Troubleshooting

### Cannot Add Product
- Check all required fields are filled
- Ensure SKU is unique
- Verify prices are positive numbers

### Stock Not Updating
- Check you have admin permissions
- Verify product exists
- Ensure quantity is valid number

### Cannot Complete Sale
- Verify products have sufficient stock
- Check payment method is selected
- Ensure cart is not empty

### Return Not Showing
- Check filter settings
- Verify return was created successfully
- Refresh the page

## Support

For technical issues or questions:
1. Check this guide first
2. Review error messages carefully
3. Contact your system administrator
4. Check deployment documentation
