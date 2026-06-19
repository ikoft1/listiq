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

const BRAND_MAP = {
  'μελισσα': 'melissa',
  'μισκο': 'misko',
  'μπαριλα': 'barilla',
  'στελα': 'stella',
  'δελτα': 'delta',
  'ολυμποσ': 'olympos',
  'δωδωνη': 'dodoni',
  'μακβελ': 'makbel',
  'χρυση ζυμη': 'chrysi zymi',
  'αλτισ': 'altis',
  'ελαισ': 'elais',
}

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function translateBrand(brand) {
  const norm = normalize(brand)
  return BRAND_MAP[norm] || norm
}

function parseQuery(query) {
  const q = normalize(query)
  const words = q.split(' ')
  let categoryId = null
  let categoryWord = null
  for (const [kw, id] of CATEGORY_MAP) {
    const normKw = normalize(kw)
    const match = words.find(w => w.startsWith(normKw))
    if (match) {
      categoryId = id
      categoryWord = match
      break
    }
  }
  const brandQuery = categoryId
    ? words.filter(w => w !== categoryWord).join(' ').trim()
    : null
  return { categoryId, brandQuery }
}

function cleanName(name, brand) {
  if (!brand || brand.length < 2) return name
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  return name.replace(regex, '').replace(/\s+/g, ' ').trim() || name
}

export async function searchProducts(query, page = 1) {
  try {
    const { categoryId, brandQuery } = parseQuery(query)
    const translatedBrand = brandQuery && brandQuery.length > 2
      ? translateBrand(brandQuery)
      : null
    const searchQuery = translatedBrand || normalize(query)
    const res = await fetch(`${WORKER}/search?q=${encodeURIComponent(searchQuery)}&page=${page}`)
    if (!res.ok) return { products: [], hasNext: false }
    const data = await res.json()
    const products = (data.products || [])
      .filter(p => {
        if (categoryId && !p.category_ids?.includes(categoryId)) return false
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

export function getBestStore(items) {
  const itemsWithPrices = items.filter(i => i.retailer_prices?.length > 0)
  if (!itemsWithPrices.length) return null
  const stores = {}
  for (const item of itemsWithPrices) {
    for (const rp of item.retailer_prices) {
      if (!stores[rp.retailer]) {
        stores[rp.retailer] = {
          retailer: rp.retailer,
          name: rp.retailer_display_name,
          total: 0,
          count: 0,
        }
      }
      stores[rp.retailer].total += rp.price * (item.quantity || 1)
      stores[rp.retailer].count += 1
    }
  }
  const minItems = Math.ceil(itemsWithPrices.length * 0.5)
  const validStores = Object.values(stores).filter(s => s.count >= minItems)
  if (!validStores.length) return null
  return validStores.reduce((best, s) => s.total < best.total ? s : best, validStores[0])
}

export async function findBestStores(items) {
  const stores = {}

  for (const item of items) {
    try {
      let retailer_prices = []

      if (item.product_id) {
        // Ψάξε με product_id απευθείας
        const res = await fetch(`${WORKER}/barcode/${item.product_id}`)
        if (res.ok) {
          const data = await res.json()
          const p = (data.products || [])[0]
          if (p) retailer_prices = p.retailer_prices || []
        }
      }

      // Fallback: ψάξε με όνομα αν δεν βρήκε με product_id
      if (!retailer_prices.length) {
        const shortName = item.name.split(' ').slice(0, 3).join(' ')
        const { products } = await searchProducts(shortName, 1)
        if (products?.length) retailer_prices = products[0].retailer_prices || []
      }

      if (!retailer_prices.length) continue

      for (const rp of retailer_prices) {
        if (!stores[rp.retailer]) {
          stores[rp.retailer] = {
            retailer: rp.retailer,
            name: rp.retailer_display_name,
            total: 0,
            found: 0,
            items: [],
          }
        }
        stores[rp.retailer].total += rp.price
        stores[rp.retailer].found += 1
        stores[rp.retailer].items.push({
          name: item.name,
          price: rp.price,
        })
      }
    } catch {}
  }

  const allItems = items.map(i => i.name)
  const minItems = Math.ceil(items.length * 0.3)

  return Object.values(stores)
    .filter(s => s.found >= minItems)
    .sort((a, b) => {
      if (b.found !== a.found) return b.found - a.found
      return a.total - b.total
    })
    .map(s => ({
      ...s,
      missing: allItems.filter(name => !s.items.find(i => i.name === name)),
    }))
}
