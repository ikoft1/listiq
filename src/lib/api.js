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
  ['μακαρον', 'b2a17c2ad4235ea8574d6027635d7c07'],
  ['ζυμαρ', 'b2a17c2ad4235ea8574d6027635d7c07'],
  ['σπαγγετ', 'b2a17c2ad4235ea8574d602763764783'],
  ['ελαιολαδ', 'b2a17c2ad4235ea8574d602763785257'],
  ['αυγ', 'b2a17c2ad4235ea8574d6027636c6884'],
  ['ρυζ', 'b2a17c2ad4235ea8574d602763773ab5'],
  ['καφ', 'b2a17c2ad4235ea8574d602763685e44'],
  ['νερ', 'b2a17c2ad4235ea8574d60276397e910'],
  ['χαρτ', 'b2a17c2ad4235ea8574d6027639e561f'],
]

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Βρες το category keyword και επέστρεψε {categoryId, brandQuery}
function parseQuery(query) {
  const q = normalize(query)
  for (const [kw, id] of CATEGORY_MAP) {
    const normKw = normalize(kw)
    if (q.includes(normKw)) {
      // Ό,τι περισσεύει μετά το keyword = brand
      const brandQuery = q.replace(normKw, '').trim()
      return { categoryId: id, brandQuery }
    }
  }
  return { categoryId: null, brandQuery: null }
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

    const { categoryId, brandQuery } = parseQuery(query)

    const products = (data.products || [])
      .filter(p => {
        // Φίλτρο category
        if (categoryId && !p.category_ids?.includes(categoryId)) return false
        // Φίλτρο brand (αν υπάρχει)
        if (brandQuery && brandQuery.length > 1) {
          return normalize(p.brand || '').includes(brandQuery) ||
                 normalize(p.name || '').includes(brandQuery)
        }
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
