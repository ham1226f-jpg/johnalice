# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Cannot Login - "Invalid Credentials"
**Problem**: Email or password is incorrect

**Solutions**:
1. Verify email is typed correctly
2. Check Caps Lock is off
3. Try resetting password
4. Contact admin to verify account exists
5. Check if account was recently created (may need a few minutes)

#### Cannot Login - "Network Error"
**Problem**: Cannot connect to server

**Solutions**:
1. Check internet connection
2. Try refreshing the page
3. Clear browser cache
4. Try different browser
5. Check if site is down (contact admin)

#### Logged Out Unexpectedly
**Problem**: Session expired

**Solutions**:
1. Simply log in again
2. Your work is saved automatically
3. If happens frequently, check internet stability

### POS Issues

#### Product Not Appearing in Search
**Problem**: Cannot find product

**Solutions**:
1. Check spelling of product name
2. Try searching by SKU instead
3. Try partial name (e.g., "fish" instead of "fried fish")
4. Check if product is archived (admin only)
5. Verify product exists in inventory (admin only)

#### Cannot Add Product to Cart
**Problem**: Product is grayed out or won't add

**Solutions**:
1. Check product stock level
2. If "Out of Stock", contact admin to restock
3. Refresh page and try again
4. Check if product is archived

#### Cart Quantities Wrong
**Problem**: Wrong number of items in cart

**Solutions**:
1. Use + and - buttons to adjust
2. Click X to remove item completely
3. Re-add product if needed
4. Clear cart and start over if confused

#### Discount Not Applying
**Problem**: Discount doesn't show in total

**Solutions**:
1. Verify discount amount is entered
2. Check discount type (% vs fixed)
3. Ensure discount is not larger than subtotal
4. Refresh page if needed

#### Cannot Complete Checkout
**Problem**: Checkout button doesn't work

**Solutions**:
1. Verify cart is not empty
2. Check payment method is selected
3. For cash: verify amount tendered is entered
4. Check for error messages
5. Try refreshing page

### Transaction Issues

#### Transaction Not Showing
**Problem**: Recent sale doesn't appear in list

**Solutions**:
1. Refresh the page
2. Check date filter (may be set to past date)
3. Clear search box
4. Check "All Time" date range
5. Verify sale actually completed

#### Cannot View Transaction Details
**Problem**: Details won't open

**Solutions**:
1. Try clicking again
2. Refresh page
3. Check internet connection
4. Try different browser

#### Receipt Won't Print
**Problem**: Print dialog doesn't open

**Solutions**:
1. Check browser allows pop-ups
2. Verify printer is connected
3. Try "Reprint Receipt" from transaction details
4. Use browser's print function (Ctrl+P / Cmd+P)
5. Check printer has paper

### Inventory Issues (Admin Only)

#### Cannot Create Product
**Problem**: Product creation fails

**Solutions**:
1. Check all required fields are filled
2. Verify SKU is unique (not already used)
3. Ensure prices are positive numbers
4. Check stock quantity is valid number
5. Try shorter product name if very long

#### Stock Not Updating
**Problem**: Stock adjustment doesn't save

**Solutions**:
1. Verify you have admin permissions
2. Check quantity is valid number
3. Ensure reason is provided
4. Try refreshing page
5. Check internet connection

#### Cannot Export CSV
**Problem**: Export button doesn't work

**Solutions**:
1. Check browser allows downloads
2. Verify you have data to export
3. Try different browser
4. Check popup blockers
5. Look in Downloads folder (may have downloaded)

### Purchase Order Issues (Admin Only)

#### Cannot Create PO
**Problem**: PO creation fails

**Solutions**:
1. Verify all required fields filled
2. Check at least one item added
3. Ensure quantities are positive
4. Verify costs are valid numbers
5. Try refreshing page

#### Cannot Update PO Status
**Problem**: Status won't change

**Solutions**:
1. Verify you're following correct order: Draft → Ordered → Received → Completed
2. Check you have admin permissions
3. Refresh page and try again
4. Verify PO exists

#### Stock Not Updating After Restock
**Problem**: Inventory doesn't increase

**Solutions**:
1. Verify you clicked "Confirm Restock"
2. Check product stock in inventory
3. View stock history to confirm
4. May need to refresh inventory page

### Return Issues

#### Cannot Create Return
**Problem**: Return creation fails

**Solutions**:
1. Verify transaction is selected
2. Check at least one item selected for return
3. Ensure quantities don't exceed original
4. Provide detailed reason (min 10 characters)
5. Check internet connection

#### Return Status Not Updating
**Problem**: Return stays "Pending"

**Solutions**:
1. Wait for admin to review
2. Contact admin to approve/reject
3. Refresh page to see updates
4. Check return details for status

#### Stock Not Restored After Approval
**Problem**: Inventory doesn't increase

**Solutions**:
1. Verify return was approved (not just pending)
2. Check product stock in inventory
3. View stock history for return entry
4. Contact admin if issue persists

### User Management Issues (Admin Only)

#### Cannot Create User
**Problem**: User creation fails

**Solutions**:
1. Check email is valid format
2. Verify email is not already used
3. Ensure password is at least 8 characters
4. Check all required fields filled
5. Try different email if persists

#### Cannot Delete User
**Problem**: Delete button doesn't work

**Solutions**:
1. Check you're not trying to delete last admin
2. Verify you have admin permissions
3. Confirm deletion in dialog
4. Try refreshing page

#### Cannot Change Password
**Problem**: Password change fails

**Solutions**:
1. For self: verify current password is correct
2. Ensure new password is at least 8 characters
3. Check passwords match
4. Try logging out and back in

### Performance Issues

#### System Running Slow
**Problem**: Pages load slowly

**Solutions**:
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try different browser
5. Restart browser
6. Check if many users online (contact admin)

#### Page Won't Load
**Problem**: Blank or stuck page

**Solutions**:
1. Refresh the page (F5 or Cmd+R)
2. Clear browser cache
3. Try incognito/private mode
4. Try different browser
5. Check internet connection
6. Contact admin if site is down

#### Images Not Loading
**Problem**: Icons or images missing

**Solutions**:
1. Refresh page
2. Clear browser cache
3. Check internet connection
4. Try different browser

### Data Issues

#### Data Not Saving
**Problem**: Changes don't persist

**Solutions**:
1. Check internet connection
2. Look for error messages
3. Try action again
4. Refresh page and verify
5. Contact admin if continues

#### Wrong Data Showing
**Problem**: Incorrect information displayed

**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Check filters are correct
4. Verify date range settings
5. Log out and back in

### Mobile/PWA Issues

#### Cannot Install PWA
**Problem**: Install prompt doesn't appear

**Solutions**:
1. Ensure using HTTPS (secure connection)
2. Try different browser (Chrome recommended)
3. Check browser supports PWA
4. Look for install icon in address bar
5. Try on different device

#### PWA Not Working Offline
**Problem**: App doesn't work without internet

**Solutions**:
1. Note: Most features require internet
2. Some cached data may work offline
3. Reconnect to internet for full functionality
4. Check service worker is registered

### Browser-Specific Issues

#### Chrome Issues
- Clear cache: Settings → Privacy → Clear browsing data
- Disable extensions temporarily
- Try incognito mode
- Update Chrome to latest version

#### Firefox Issues
- Clear cache: Options → Privacy → Clear Data
- Disable add-ons temporarily
- Try private window
- Update Firefox to latest version

#### Safari Issues
- Clear cache: Safari → Clear History
- Check "Prevent Cross-Site Tracking" is off
- Try private browsing
- Update Safari/macOS

#### Edge Issues
- Clear cache: Settings → Privacy → Clear browsing data
- Disable extensions temporarily
- Try InPrivate mode
- Update Edge to latest version

## Error Messages

### "Invalid API Key"
**Meaning**: Cannot connect to database

**Solutions**:
1. Contact admin immediately
2. Check internet connection
3. Verify site URL is correct
4. Admin: Check environment variables

### "Insufficient Permissions"
**Meaning**: You don't have access to this feature

**Solutions**:
1. Verify you're logged in
2. Check your user role
3. Contact admin if you should have access
4. May need admin role for this feature

### "Network Error"
**Meaning**: Cannot reach server

**Solutions**:
1. Check internet connection
2. Try refreshing page
3. Wait a moment and try again
4. Contact admin if persists

### "Database Error"
**Meaning**: Problem with data storage

**Solutions**:
1. Try action again
2. Refresh page
3. Contact admin
4. Admin: Check Supabase dashboard

### "Validation Error"
**Meaning**: Form data is incorrect

**Solutions**:
1. Read error message carefully
2. Check all required fields
3. Verify data format (email, numbers, etc.)
4. Fix highlighted fields
5. Try submitting again

## Prevention Tips

### Avoid Common Issues

**Regular Maintenance**
- Clear browser cache weekly
- Keep browser updated
- Restart browser daily
- Check internet connection

**Best Practices**
- Save work frequently (auto-saves in most cases)
- Don't use browser back button
- Use provided navigation
- Log out when done
- Don't share passwords

**Data Entry**
- Double-check before submitting
- Use correct formats
- Fill all required fields
- Verify quantities and prices

## When to Contact Admin

Contact your administrator if:
- Issue persists after trying solutions
- Error messages appear repeatedly
- Data seems incorrect or missing
- Cannot access features you should have
- System is down or very slow
- Need password reset
- Need account created/modified
- Have questions about features

## Emergency Procedures

### System Completely Down
1. Verify internet connection
2. Try accessing from different device
3. Contact admin immediately
4. Use backup process if available
5. Document what happened

### Data Loss Suspected
1. Don't make more changes
2. Contact admin immediately
3. Provide details of what was lost
4. Admin can check backups
5. Document timeline of events

### Security Concern
1. Log out immediately
2. Contact admin
3. Change password when able
4. Don't share details publicly
5. Follow admin instructions

## Getting Additional Help

### Documentation
- Admin Guide: For full feature details
- Sales Person Guide: For POS and basic features
- Deployment Guide: For technical setup

### Support Channels
1. Contact your system administrator
2. Check documentation first
3. Provide error messages
4. Explain steps to reproduce
5. Note what you've already tried

### Reporting Bugs
When reporting issues, include:
- What you were trying to do
- What happened instead
- Any error messages
- Browser and device info
- Steps to reproduce
- Screenshots if helpful

---

**Remember**: Most issues can be solved with a simple refresh or by checking your internet connection. Don't hesitate to ask for help!
