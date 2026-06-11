const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkSwappedPrices() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const restPath = process.env.NEXT_PUBLIC_SUPABASE_REST_PATH || '/rest/pos/v1'

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public'
    },
    global: {
      fetch: (url, options) => {
        const rewritten = url.replace(`${supabaseUrl}/rest/v1`, `${supabaseUrl}${restPath}`)
        return fetch(rewritten, options)
      }
    }
  })

  console.log('🔍 Checking for products with swapped prices...\n')

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, cost, price, category')
    .not('cost', 'is', null)
    .not('price', 'is', null)
    .eq('is_archived', false)
    .order('name')

  if (error) {
    console.error('❌ Error fetching products:', error)
    return
  }

  console.log(`📦 Total products checked: ${data.length}\n`)

  const swapped = data.filter(p => parseFloat(p.cost) > parseFloat(p.price))
  
  if (swapped.length === 0) {
    console.log('✅ No products found with swapped prices!')
    return
  }

  console.log(`⚠️  Found ${swapped.length} products with cost > price:\n`)
  console.log('═'.repeat(80))
  
  swapped.forEach((p, index) => {
    console.log(`\n${index + 1}. ${p.name}`)
    console.log(`   SKU: ${p.sku}`)
    console.log(`   Category: ${p.category}`)
    console.log(`   ❌ Current Cost (buying): KSH ${parseFloat(p.cost).toFixed(2)}`)
    console.log(`   ❌ Current Price (selling): KSH ${parseFloat(p.price).toFixed(2)}`)
    console.log(`   💰 Negative Profit: KSH ${(parseFloat(p.price) - parseFloat(p.cost)).toFixed(2)}`)
    console.log(`   ─`.repeat(40))
    console.log(`   ✅ Should be Cost: KSH ${parseFloat(p.price).toFixed(2)}`)
    console.log(`   ✅ Should be Price: KSH ${parseFloat(p.cost).toFixed(2)}`)
    console.log(`   💚 Correct Profit: KSH ${(parseFloat(p.cost) - parseFloat(p.price)).toFixed(2)}`)
  })

  console.log('\n' + '═'.repeat(80))
  console.log(`\n📊 Summary: ${swapped.length} products need fixing`)
  console.log('\n💡 To fix these, run: node scripts/fix-swapped-prices-standalone.js\n')

  return swapped
}

checkSwappedPrices().catch(console.error)
