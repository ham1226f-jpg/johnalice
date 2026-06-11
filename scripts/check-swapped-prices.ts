import { createClient } from '@/lib/supabase/client'

async function checkSwappedPrices() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, cost, price')
    .not('cost', 'is', null)
    .not('price', 'is', null)
    .order('name')

  if (error) {
    console.error('Error:', error)
    return
  }

  const swapped = data.filter((p: any) => parseFloat(p.cost) > parseFloat(p.price))
  
  console.log(`\nFound ${swapped.length} products with potentially swapped prices:\n`)
  swapped.forEach((p: any) => {
    console.log(`Name: ${p.name}`)
    console.log(`SKU: ${p.sku}`)
    console.log(`Current Cost: KSH ${p.cost}`)
    console.log(`Current Price: KSH ${p.price}`)
    console.log(`ID: ${p.id}`)
    console.log('---')
  })

  return swapped
}

checkSwappedPrices()
