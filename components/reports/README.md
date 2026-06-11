# Reports Components

This directory contains all the report components for the POS system's Reports & Analytics feature.

## Components

### ReportsContainer.tsx
Main container component that manages the tab-based interface for all reports.

**Features:**
- Tab navigation between different report types
- Responsive tab layout (icons only on mobile, icon + text on larger screens)
- State management for active tab

**Usage:**
```tsx
import { ReportsContainer } from '@/components/reports/ReportsContainer'

<ReportsContainer />
```

### SalesReport.tsx
Generates comprehensive sales analysis reports.

**Data Included:**
- Total sales count and revenue
- Gross profit and profit margin
- Sales by payment method
- Top 20 selling products
- Sales by category
- Daily sales breakdown

**Props:** None (uses auth context for tenant/store)

**Service:** `generateSalesReport()` from `@/lib/services/reports`

### StockReport.tsx
Generates detailed inventory and stock movement reports.

**Data Included:**
- Opening and closing stock quantities
- Stock value calculations
- Complete movement history
- Low stock alerts
- Category-wise analysis

**Props:** None (uses auth context for tenant/store)

**Service:** `generateStockReport()` from `@/lib/services/reports`

### TransactionsReport.tsx
Generates detailed transaction and profit/loss reports.

**Data Included:**
- All transactions with full details
- Item-level breakdown
- Profit/loss per transaction
- Daily P&L analysis
- Debt tracking

**Props:** None (uses auth context for tenant/store)

**Service:** `generateTransactionsReport()` from `@/lib/services/reports`

### ExpensesReport.tsx
Generates comprehensive expense tracking reports.

**Data Included:**
- Complete expense listing
- Category breakdown
- Daily expense trends
- Top expense categories
- Receipt references

**Props:** None (uses auth context for tenant/store)

**Service:** `generateExpensesReport()` from `@/lib/services/reports`

### ReceiptSettings.tsx
Allows customization of receipt branding and information.

**Features:**
- Business information form
- Live receipt preview
- Per-store settings
- Validation and error handling

**Props:** None (uses auth context for tenant/store)

**Service:** `getReceiptSettings()` and `saveReceiptSettings()` from `@/lib/services/receipt-settings`

## Common Patterns

### Date Range Selection
All report components use the same date range pattern:
```tsx
const [startDate, setStartDate] = useState<Date>(
  new Date(new Date().setDate(new Date().getDate() - 30))
)
const [endDate, setEndDate] = useState<Date>(new Date())
```

### Export Functionality
All reports use the CSV export utility:
```tsx
import { exportToCSV } from '@/lib/utils/export'

const handleExport = async () => {
  const report = await generateReport(...)
  const csvData = [/* formatted data */]
  exportToCSV(csvData, 'filename')
}
```

### Loading States
All components implement loading states:
```tsx
const [loading, setLoading] = useState(false)

// In button
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <Download className="mr-2 h-4 w-4" />
      Export to CSV
    </>
  )}
</Button>
```

### Error Handling
All components use toast notifications:
```tsx
try {
  // Operation
  toast.success('Success message')
} catch (error: any) {
  toast.error(error.message || 'Error message')
}
```

## Styling

All components use:
- **Card components** for consistent layout
- **Tailwind CSS** for styling
- **Lucide icons** for visual elements
- **Responsive design** with mobile-first approach

### Responsive Breakpoints
- Mobile: `< 640px` (sm)
- Tablet: `640px - 1024px` (sm to lg)
- Desktop: `> 1024px` (lg+)

## Dependencies

### UI Components
- `@/components/ui/card`
- `@/components/ui/button`
- `@/components/ui/date-picker`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/textarea`
- `@/components/ui/tabs`

### Icons
- `lucide-react` (Download, FileSpreadsheet, Package, Receipt, Wallet, Settings, Loader2)

### Utilities
- `@/lib/utils/export` - CSV export
- `@/lib/services/reports` - Report generation
- `@/lib/services/receipt-settings` - Receipt CRUD
- `@/contexts/AuthContext` - User/tenant/store context
- `sonner` - Toast notifications

## Testing

### Manual Testing Checklist
- [ ] Date pickers work correctly
- [ ] Export button generates CSV
- [ ] CSV file downloads
- [ ] CSV opens in Excel/Google Sheets
- [ ] Loading states display
- [ ] Error messages show
- [ ] Success messages appear
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop

### Test Data Requirements
- Transactions with items
- Products with costs
- Stock history records
- Expenses with categories
- Multiple date ranges

## Performance Considerations

### Optimization Techniques
1. **Lazy Loading** - Components loaded on demand
2. **Memoization** - Date ranges memoized
3. **Efficient Queries** - Database queries optimized
4. **Client-side Aggregation** - Reduce server load
5. **Minimal Re-renders** - Proper state management

### Large Dataset Handling
- Reports handle thousands of records
- Client-side processing for aggregations
- Efficient date filtering
- Proper indexing in database

## Security

### Access Control
- All reports require authentication
- Admin-only access enforced at page level
- Tenant isolation in all queries
- Store filtering applied

### Data Protection
- No sensitive data in URLs
- Secure API calls
- RLS policies enforced
- Input validation

## Troubleshooting

### Common Issues

**Reports not generating**
- Check auth context is available
- Verify tenant and store IDs
- Ensure data exists for date range
- Check browser console for errors

**CSV not downloading**
- Check browser download settings
- Disable popup blockers
- Try different browser
- Check file permissions

**Incorrect data**
- Verify product costs are set
- Check date range is correct
- Ensure proper tenant/store filtering
- Review database queries

**Styling issues**
- Check Tailwind CSS is loaded
- Verify responsive classes
- Test on different screen sizes
- Check for CSS conflicts

## Future Enhancements

### Planned Features
- PDF export option
- Email report scheduling
- Custom report builder
- Graphical charts
- Advanced filtering
- Report templates

### Community Requests
- More export formats
- Additional report types
- Data visualization
- Comparison reports
- Forecasting

## Contributing

When adding new report components:

1. Follow existing patterns
2. Use TypeScript strictly
3. Implement loading states
4. Add error handling
5. Make it responsive
6. Document the component
7. Test thoroughly

## Support

For issues or questions:
1. Check component documentation
2. Review service layer code
3. Check browser console
4. Contact development team

---

**Last Updated:** April 28, 2026  
**Version:** 1.0.0  
**Maintainer:** Development Team
