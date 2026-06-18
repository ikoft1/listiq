const WORKER = 'https://listiq-api.ikoft3.workers.dev'

const CATEGORY_MAP = [
  ['φετ', '5f277dd598114bc2902432b1045806df'],
  ['γαλ', 'b2a17c2ad4235ea8574d6027636cb739'],
  ['γραβιερ', '18082a808952446192226936b3f6e6c0'],
  ['κασερ', 'e6d74d0fbca34796839a7c41ab5ac85f'],
  ['γιαουρτ', 'b2a17c2ad4235ea8574d6027636cf9c5'],
  ['τυρ', 'b2a17c2ad4235ea8574d6027636cf85d'],
  ['μπυρ', 'b2a17c2ad4235ea8574d602763965cf7'],
  ['κρασ', 'b2a17c2ad4235ea8574d60276395d5d4'],
  // προσθεσε οσα θες
]

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function getExactCategoryId(query) {
  const q = normalize(query)
  for (const [kw, id] of CATEGORY_MAP) {
    if (q.includes(normalize(kw))) return id
  }
  return null
}

function cleanName(name, brand) {
  if (!brand || brand.length < 2) return name
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  return name.replace(regex, '').replace(/\s+/g, ' ').trim() || name
}

export async function searchProducts(query, page = 1) {
  try {
    const res = await fetch(`${WORKER}/search?q=${encodeURIComponent(query)}&page=${page}`)
    if (!res.ok) return { products: [], hasNext: false }
    const data = await res.json()

    const exactCategoryId = getExactCategoryId(query)

    const products = (data.products || [])
      .filter(p => {
        if (exactCategoryId) {
          // Φίλτρο: το product πρέπει να έχει ΑΚΡΙΒΩΣ αυτό το category ID
          return p.category_ids?.includes(exactCategoryId)
        }
        // Free text: κανένα φίλτρο
        return true
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
