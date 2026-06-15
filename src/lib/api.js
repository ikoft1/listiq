const BASE = 'https://listiq-api.ikoft3.workers.dev/api'

export async function searchProducts(query) {
  try {
    const res = await fetch(`${BASE}/products?search=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data?.products || data || []
  } catch {
    return []
  }
}

export async function getProductPrices(productId) {
  try {
    const res = await fetch(`${BASE}/products/${productId}/prices`)
    if (!res.ok) return []
    const data = await res.json()
    return data?.prices || data || []
  } catch {
    return []
  }
}

export async function searchByBarcode(barcode) {
  try {
    const res = await fetch(`${BASE}/products/barcode/${barcode}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function getCheapestStore(prices) {
  if (!prices?.length) return null
  return prices.reduce((min, p) => p.price < min.price ? p : min, prices[0])
}
