const WORKER = 'https://listiq-api.ikoft3.workers.dev'

const EXCLUDE_CATEGORIES = [
  'fb7311d1172f411dba075194a4120689', // Πίτες και Πιτάκια
  'b2a17c2ad4235ea8574d602763940878', // Έτοιμα προϊόντα ζύμης
]

function cleanName(name, brand) {
  if (!brand || brand.length < 2) return name
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  return name.replace(regex, '').replace(/\s+/g, ' ').trim() || name
}

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export async function searchProducts(query, page = 1) {
  try {
    const res = await fetch(`${WORKER}/search?q=${encodeURIComponent(query)}&page=${page}`)
    if (!res.ok) return { products: [], hasNext: false }
    const data = await res.json()

    const products = (data.products || [])
      .filter(p => {
        // Εξαίρεσε πίτες/έτοιμα ζύμης
        if (p.category_ids?.some(id => EXCLUDE_CATEGORIES.includes(id))) return false
        // Κράτα μόνο αυτά που έχουν το query στο όνομα
        return normalize(p.name).includes(normalize(query))
      })
      .map(p => {
        const brand = p.brand?.trim() || ''
        const name = cleanName(p.name, brand)
        return {
          id: p.id,
          name,
          brand,
          price: p.price_stats?.min_price || null,
          image: p.image_url || null,
          unit: p.unit,
          unit_quantity: p.unit_quantity,
          retailer_prices: p.retailer_prices || [],
        }
      })

    return {
      products,
      hasNext: data.has_next || false,
      page: data.page || 1,
    }
  } catch {
    return { products: [], hasNext: false }
  }
}

export async function searchByBarcode(barcode) {
  try {
    const res = await fetch(`${WORKER}/barcode/${barcode}`)
    if (!res.ok) return null
    const data = await res.json()
    const p = (data.products || [])[0]
    if (!p) return null
    const brand = p.brand?.trim() || ''
    const name = cleanName(p.name, brand)
    return {
      id: p.id,
      name,
      brand,
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
