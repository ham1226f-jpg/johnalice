import { createClient } from '@/lib/supabase/client'

async function fixSwappedPrices() {
  const supabase = createClient()

  // Find products where cost > price (likely swapped)
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, cost, price')
    .not('cost', 'is', null)
    .not('price', 'is', null)
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  const swapped = data.filter((p: any) => parseFloat(p.cost) > parseFloat(p.price))
  
  if (swapped.length === 0) {
    console.log('✅ No products found with swapped prices!')
    return
  }

  console.log(`\n🔍 Found ${swapped.length} products with swapped prices:\n`)
  
  // Show what will be fixed
  swapped.forEach((p: any) => {
    console.log(`📦 ${p.name} (${p.sku})`)
    console.log(`   Current: Cost=${p.cost}, Price=${p.price}`)
    console.log(`   Will fix to: Cost=${p.price}, Price=${p.cost}`)
    console.log('---')
  })

  console.log('\n🔧 Fixing swapped prices...\n')

  // Fix each product by swapping cost and price
  let successCount = 0
  let errorCount = 0

  for (const product of swapped) {
    const { error: updateError } = await supabase
      .from('products')
      .update({
        cost: product.price,  // Swap: old price becomes new cost
        price: product.cost,  // Swap: old cost becomes new price
      })
      .eq('id', product.id)

    if (updateError) {
      console.error(`❌ Failed to fix ${product.name}:`, updateError)
      errorCount++
    } else {
      console.log(`✅ Fixed ${product.name}`)
      successCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully fixed: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log(`   📦 Total processed: ${swapped.length}`)
}

// Run the fix
fixSwappedPrices().catch(console.error)
