# Interactive Tour Guide - User Guide

## 🎯 Overview

The Interactive Tour Guide system is now integrated into your Restaurant POS application. This guide will help you understand how to use it.

## ✅ What's Working

The tour system is fully functional with:
- ✅ Database tables created in Supabase
- ✅ Tour context and state management
- ✅ All UI components (Overlay, Tooltip, Help Button, Menu, etc.)
- ✅ Sample POS tours (3 tours with 22 steps)
- ✅ Progress tracking
- ✅ Analytics

## 🚀 How to Access Tours

### Method 1: Help Button (Recommended)
1. Navigate to any page in the POS system
2. Look for the **blue floating help button** in the bottom-right corner
3. Click the help button to see available tours for that page
4. Select a tour to start

### Method 2: Direct Integration (For Developers)
Tours can be started programmatically using the `useTour` hook:

```typescript
import { useTour } from '@/contexts/TourContext'

function MyComponent() {
  const { startTour } = useTour()
  
  return (
    <button onClick={() => startTour('pos-basic-sale')}>
      Start POS Tour
    </button>
  )
}
```

## 📚 Available Tours

### POS Page Tours

1. **Making Your First Sale** (12 steps, ~4 minutes)
   - Learn the complete sales process
   - Product search and selection
   - Cart management
   - Customer selection
   - Discount application
   - Checkout and payment
   - Receipt printing

2. **Advanced POS Features** (5 steps, ~3 minutes)
   - Custom pricing for variable-priced products
   - Quick sale feature
   - Floating cart management
   - Keyboard shortcuts

3. **POS Keyboard Shortcuts** (5 steps, ~2 minutes)
   - Ctrl+K for quick search
   - Ctrl+Enter for checkout
   - Escape to clear cart
   - Efficiency tips

## 🎮 Using Tours

### During a Tour

**Navigation:**
- Click **Next** to advance to the next step
- Click **Previous** to go back
- Click **Skip Tour** to exit
- Use **Arrow Keys** (← →) for keyboard navigation
- Press **Escape** to exit the tour

**Visual Elements:**
- **Spotlight**: Highlights the relevant UI element
- **Tooltip**: Shows step instructions and controls
- **Progress Bar**: Shows your position in the tour

### Interactive Steps

Some tour steps are interactive - they wait for you to perform an action:
- Look for the "✨ Interactive step" indicator
- Perform the requested action
- The tour will automatically advance when you complete it
- If you're stuck for 30 seconds, a hint will appear

## 📊 Tracking Your Progress

### View Progress
1. Your progress is automatically saved
2. Completed tours show a ✓ checkmark
3. In-progress tours show a clock icon
4. The help button shows a badge with incomplete tour count

### Reset Progress
1. Open the tour menu (help button)
2. Click "Reset All Progress" at the bottom
3. Confirm the action

## 🔧 For Administrators

### Adding Tours to New Pages

To add tour support to a page:

1. **Add the Help Button:**
```tsx
import { TourHelpButton } from '@/components/tour/TourHelpButton'

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <TourHelpButton pageId="my-page" />
    </div>
  )
}
```

2. **Add data-tour attributes to elements:**
```tsx
<input
  data-tour="search-input"
  placeholder="Search..."
/>

<button data-tour="submit-button">
  Submit
</button>
```

3. **Create tour definitions** in `lib/tours/my-page-tours.ts`

### Creating New Tours

See `lib/tours/pos-tours.ts` for examples. Each tour needs:
- Unique ID
- Title and description
- Page ID
- Category (getting-started, daily-tasks, advanced)
- Estimated duration
- Array of steps with:
  - Title and content
  - Target selector (CSS selector or data-tour attribute)
  - Placement (top, bottom, left, right, center)
  - Interactive flag (optional)

## 🐛 Troubleshooting

### Tour Not Starting
- **Check**: Is the TourProvider in app/layout.tsx?
- **Check**: Is the TourEngine component rendered?
- **Check**: Does the tour ID exist in the tour registry?
- **Solution**: Refresh the page and try again

### Element Not Highlighting
- **Check**: Does the element have the correct `data-tour` attribute?
- **Check**: Is the element visible on the page?
- **Solution**: Scroll to make the element visible

### Help Button Not Showing
- **Check**: Is `<TourHelpButton pageId="..." />` added to the page?
- **Check**: Are there tours defined for that page ID?
- **Solution**: Add tours for the page or check the page ID matches

### Progress Not Saving
- **Check**: Is the user logged in?
- **Check**: Is the database connection working?
- **Check**: Browser console for errors
- **Solution**: Check Supabase connection and RLS policies

## 📱 Mobile Support

The tour system works on mobile devices:
- Tooltips adapt to screen size
- Touch-friendly buttons
- Responsive spotlight
- Swipe gestures (coming soon)

## ♿ Accessibility

The tour system is accessible:
- Keyboard navigation (Arrow keys, Enter, Escape)
- ARIA labels and roles
- Screen reader support
- Focus management

## 🎯 Best Practices

### For Users
1. Complete the "Getting Started" tours first
2. Use keyboard shortcuts for efficiency
3. Don't skip important steps
4. Revisit tours when you need a refresher

### For Administrators
1. Encourage new users to complete tours
2. Monitor tour completion rates in analytics
3. Update tours when features change
4. Create custom tours for your specific workflows

## 📈 Analytics

Tour engagement is tracked automatically:
- Tour starts and completions
- Step completions and skips
- Time spent on each tour
- Hint displays

Access analytics via:
```typescript
import { getTourAnalytics } from '@/lib/services/tours'

const analytics = await getTourAnalytics(tenantId)
```

## 🔮 Coming Soon

Features in development:
- Dashboard tours
- Inventory management tours
- Transaction history tours
- Purchase order tours
- Returns management tours
- User management tours
- Welcome tour sequence for first-time users
- Mobile swipe gestures
- Video tutorials
- Interactive simulations

## 💡 Tips

1. **Use the help button** - It's always available in the bottom-right corner
2. **Complete tours in order** - Start with "Getting Started" category
3. **Practice makes perfect** - Revisit tours to reinforce learning
4. **Use keyboard shortcuts** - They make you much faster
5. **Check your progress** - See how much you've learned

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look for error messages in the browser console
3. Check the troubleshooting section
4. Contact your system administrator

## 🎉 Get Started!

1. Navigate to the POS page
2. Click the blue help button in the bottom-right
3. Select "Making Your First Sale"
4. Follow the interactive tour
5. Complete all POS tours to master the system!

---

**The Interactive Tour Guide makes learning the POS system easy and fun. Start your first tour today!**
