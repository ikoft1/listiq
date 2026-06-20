const STORAGE_KEY = 'listiq_favourites'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getFavourites() {
  return load()
}

export function addFavourites(products) {
  const current = load()
  const newItems = products.filter(p =>
    !current.find(f => f.product_id === p.product_id || f.name === p.name)
  ).map(p => ({
    id: crypto.randomUUID(),
    product_id: p.product_id || null,
    name: p.name,
    brand: p.brand || null,
    price: p.price || null,
    unit: p.unit || null,
    unit_quantity: p.unit_quantity || null,
    retailer_prices: p.retailer_prices || [],
    category_ids: p.category_ids || [],
    added_at: new Date().toISOString(),
  }))
  const merged = [...current, ...newItems]
  save(merged)
  return merged
}

export function removeFavourite(id) {
  const updated = load().filter(f => f.id !== id)
  save(updated)
  return updated
}

export function clearFavourites() {
  save([])
}
