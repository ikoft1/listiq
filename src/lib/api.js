const WORKER = 'https://listiq-api.ikoft3.workers.dev'

export async function searchProducts(query) {
  try {
    const res = await fetch(`${WORKER}/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.products || []).map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price_stats?.min_price || null,
      image: p.image_url || null,
      unit: p.unit,
      unit_quantity: p.unit_quantity,
      retailer_prices: p.retailer_prices || [],
    }))
  } catch {
    return []
  }
} 

export async function searchByBarcode(barcode) {
  try {
    const res = await fetch(`${WORKER}/barcode/${barcode}`)
    if (!res.ok) return null
    const data = await res.json()
    const p = (data.products || [])[0]
    if (!p) return null
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price_stats?.min_price || null,
      image: p.image_url || null,
      retailer_prices: p.retailer_prices || [],
    }
  } catch {
    return null
  }
}

export function getCheapestStore(retailer_prices) {
  if (!retailer_prices?.length) return null
  return retailer_prices.reduce((min, p) => p.price < min.price ? p : min, retailer_prices[0])
}
