# Tour Element Targeting Guide

This guide explains how to ensure tour steps point to the exact position of intended actions using precise element targeting.

## Overview

The tour system now supports precise element targeting using `data-tour-id` attributes and enhanced positioning logic. This ensures tooltips and highlights appear exactly where they should, even with dynamic content.

## Using data-tour-id Attributes

### Why Use data-tour-id?

- **Stability**: CSS classes and IDs can change; data attributes are stable
- **Specificity**: Target exact elements without complex selectors
- **Clarity**: Makes it obvious which elements are tour targets
- **Performance**: Faster DOM queries with attribute selectors

### Adding data-tour-id to Components

```tsx
// Example: Button component
<button 
  data-tour-id="add-product-button"
  className="btn btn-primary"
  onClick={handleAddProduct}
>
  Add Product
</button>

// Example: Input field
<input
  data-tour-id="product-search-input"
  type="text"
  placeholder="Search products..."
/>

// Example: Card component
<div data-tour-id="inventory-card" className="card">
  <h3>Inventory Overview</h3>
  {/* ... */}
</div>
```

### Naming Convention

Use descriptive, kebab-case names that indicate:
1. The element type or function
2. The page or section it belongs to (if needed)

Examples:
- `add-product-button`
- `checkout-modal-confirm`
- `inventory-search-input`
- `user-form-submit`
- `dashboard-stats-card`

## Updating Tour Definitions

### Old Way (CSS Selectors)

```typescript
{
  id: 'step-1',
  title: 'Add Product',
  content: 'Click here to add a new product',
  targetSelector: 'button.btn-primary:nth-child(2)', // Fragile!
  placement: 'bottom'
}
```

### New Way (data-tour-id)

```typescript
{
  id: 'step-1',
  title: 'Add Product',
  content: 'Click here to add a new product',
  targetSelector: '[data-tour-id="add-product-button"]', // Stable!
  placement: 'bottom'
}
```

## Helper Functions

### tourId() - Generate Selector

```typescript
import { tourId } from '@/lib/tour/element-helpers'

// In tour definition
{
  targetSelector: `[${tourId('add-product-button')}]`
}
```

### getTourElement() - Find Element

```typescript
import { getTourElement } from '@/lib/tour/element-helpers'

const element = getTourElement('add-product-button')
if (element) {
  // Element found
}
```

### waitForTourElement() - Wait for Dynamic Elements

```typescript
import { waitForTourElement } from '@/lib/tour/element-helpers'

try {
  const element = await waitForTourElement('add-product-button', 5000)
  // Element is now available
} catch (error) {
  // Element not found within timeout
}
```

## Enhanced Positioning Features

### 1. Automatic Element Detection

The tour engine now automatically waits for elements to appear in the DOM before showing the tour step.

### 2. Smart Scrolling

Elements are automatically scrolled into view with optimal positioning (centered in viewport).

### 3. Precise Highlighting

The overlay now includes:
- Pulsing spotlight effect
- Center position indicator (small dot)
- Corner markers for exact boundaries
- Smooth transitions on scroll/resize

### 4. Viewport Awareness

Tooltips automatically adjust position to stay within the viewport, preventing cutoff.

## Best Practices

### 1. Add data-tour-id Early

Add `data-tour-id` attributes when creating components, not as an afterthought.

```tsx
// ✅ Good: Added during component creation
export function ProductCard({ product }: Props) {
  return (
    <div data-tour-id="product-card" className="card">
      <button data-tour-id="add-to-cart-button">
        Add to Cart
      </button>
    </div>
  )
}
```

### 2. Use Unique IDs Per Page

Ensure `data-tour-id` values are unique within a page context.

```tsx
// ✅ Good: Unique IDs
<button data-tour-id="pos-checkout-button">Checkout</button>
<button data-tour-id="inventory-export-button">Export</button>

// ❌ Bad: Duplicate IDs
<button data-tour-id="submit-button">Submit Order</button>
<button data-tour-id="submit-button">Submit Return</button>
```

### 3. Target Interactive Elements

Prefer targeting the actual interactive element, not its container.

```tsx
// ✅ Good: Target the button
<div className="button-container">
  <button data-tour-id="save-button">Save</button>
</div>

// ❌ Less ideal: Target the container
<div data-tour-id="save-button" className="button-container">
  <button>Save</button>
</div>
```

### 4. Handle Dynamic Content

For elements that appear conditionally, ensure the tour step waits for them.

```tsx
// Component with conditional rendering
{isModalOpen && (
  <div data-tour-id="checkout-modal">
    <button data-tour-id="confirm-checkout">Confirm</button>
  </div>
)}

// Tour step with beforeStep hook
{
  id: 'confirm-checkout',
  title: 'Confirm Purchase',
  targetSelector: '[data-tour-id="confirm-checkout"]',
  beforeStep: async () => {
    // Ensure modal is open
    if (!isModalOpen) {
      openCheckoutModal()
      await waitForTourElement('checkout-modal')
    }
  }
}
```

## Migration Guide

### Step 1: Identify Tour Targets

Review your tour definitions and list all `targetSelector` values.

### Step 2: Add data-tour-id Attributes

Add `data-tour-id` to the corresponding components.

```tsx
// Before
<button className="btn-add-product">Add Product</button>

// After
<button 
  data-tour-id="add-product-button"
  className="btn-add-product"
>
  Add Product
</button>
```

### Step 3: Update Tour Definitions

Update `targetSelector` to use the new data attributes.

```typescript
// Before
targetSelector: '.btn-add-product'

// After
targetSelector: '[data-tour-id="add-product-button"]'
```

### Step 4: Test Tours

Run through each tour to verify:
- Elements are found correctly
- Highlighting appears in the right place
- Tooltips are positioned properly
- Scrolling works smoothly

## Debugging

### Check if Element Exists

```typescript
import { getTourElement } from '@/lib/tour/element-helpers'

const element = getTourElement('my-button')
console.log('Element found:', !!element)
```

### Validate All Tour Targets

```typescript
import { validateTourTargets } from '@/lib/tour/element-helpers'

const selectors = tour.steps.map(step => step.targetSelector)
const { valid, missing } = validateTourTargets(selectors)

console.log('Valid targets:', valid)
console.log('Missing targets:', missing)
```

### Highlight Element Temporarily

```typescript
import { highlightElement, getTourElement } from '@/lib/tour/element-helpers'

const element = getTourElement('my-button')
if (element) {
  highlightElement(element, 3000) // Highlight for 3 seconds
}
```

### List All Tour Elements

```typescript
import { getAllTourElements } from '@/lib/tour/element-helpers'

const elements = getAllTourElements()
console.log('Tour elements on page:', Array.from(elements.keys()))
```

## Example: Complete Implementation

### Component

```tsx
// components/inventory/InventoryActions.tsx
export function InventoryActions() {
  return (
    <div className="flex gap-2">
      <button 
        data-tour-id="inventory-add-button"
        onClick={handleAdd}
        className="btn btn-primary"
      >
        Add Item
      </button>
      
      <button 
        data-tour-id="inventory-export-button"
        onClick={handleExport}
        className="btn btn-secondary"
      >
        Export
      </button>
      
      <input
        data-tour-id="inventory-search-input"
        type="text"
        placeholder="Search inventory..."
        onChange={handleSearch}
      />
    </div>
  )
}
```

### Tour Definition

```typescript
// lib/tours/inventory-tours.ts
export const inventoryBasicsTour: Tour = {
  id: 'inventory-basics',
  title: 'Inventory Management Basics',
  description: 'Learn how to manage your inventory',
  pageId: 'inventory',
  category: 'getting-started',
  estimatedDuration: 3,
  steps: [
    {
      id: 'add-item',
      title: 'Add New Item',
      content: 'Click here to add a new item to your inventory',
      targetSelector: '[data-tour-id="inventory-add-button"]',
      placement: 'bottom',
      isInteractive: true,
      interactionType: 'click'
    },
    {
      id: 'search-items',
      title: 'Search Inventory',
      content: 'Use this search box to quickly find items',
      targetSelector: '[data-tour-id="inventory-search-input"]',
      placement: 'bottom',
      isInteractive: false
    },
    {
      id: 'export-data',
      title: 'Export Data',
      content: 'Export your inventory data to CSV or Excel',
      targetSelector: '[data-tour-id="inventory-export-button"]',
      placement: 'bottom',
      isInteractive: false
    }
  ]
}
```

## Summary

By using `data-tour-id` attributes and the enhanced positioning system:

1. ✅ Tour steps point to exact element positions
2. ✅ Highlighting is precise and visually clear
3. ✅ Tooltips stay within viewport bounds
4. ✅ Dynamic content is handled gracefully
5. ✅ Tours are resilient to UI changes

This approach ensures a professional, reliable tour experience for your users.
