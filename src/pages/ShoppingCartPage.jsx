import { useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'
import './ShoppingCartPage.css'

const CATEGORY_LABELS = {
  'b2a17c2ad4235ea8574d6027636cb739': '🥛 Γαλακτοκομικά',
  'b2a17c2ad4235ea8574d6027636cf9c5': '🥛 Γαλακτοκομικά',
  '5f277dd598114bc2902432b1045806df': '🧀 Τυριά',
  '18082a808952446192226936b3f6e6c0': '🧀 Τυριά',
  'e6d74d0fbca34796839a7c41ab5ac85f': '🧀 Τυριά',
  'b2a17c2ad4235ea8574d6027636cf85d': '🧀 Τυριά',
  'b2a17c2ad4235ea8574d602763965cf7': '🍺 Ποτά',
  'b2a17c2ad4235ea8574d60276395d5d4': '🍺 Ποτά',
  'b2a17c2ad4235ea8574d6027635d7c07': '🍝 Ζυμαρικά',
  'b2a17c2ad4235ea8574d602763764783': '🍝 Ζυμαρικά',
  'b2a17c2ad4235ea8574d602763785257': '🫒 Λάδια',
  'b2a17c2ad4235ea8574d6027636c6884': '🥚 Αυγά',
  'b2a17c2ad4235ea8574d602763773ab5': '🌾 Ρύζι',
  'b2a17c2ad4235ea8574d602763685e44': '☕ Καφές',
  'b2a17c2ad4235ea8574d60276397e910': '💧 Νερό',
  'b2a17c2ad4235ea8574d6027639e561f': '🧻 Χαρτικά',
}

function getCategoryLabel(item) {
  if (item.category_ids?.length) {
    for (const id of item.category_ids) {
      if (CATEGORY_LABELS[id]) return CATEGORY_LABELS[id]
    }
  }
  if (item.category_id && CATEGORY_LABELS[item.category_id]) {
    return CATEGORY_LABELS[item.category_id]
  }
  return '🛍️ Άλλα'
}

function groupByCategory(items) {
  const groups = {}
  for (const item of items) {
    const label = getCategoryLabel(item)
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === '🛍️ Άλλα') return 1
    if (b === '🛍️ Άλλα') return -1
    return a.localeCompare(b, 'el')
  })
}

// store: { retailer, name }
// storeItems: προϊόντα που βρέθηκαν στο SM (με τιμή PosoKanei)
// allListItems: όλη η λίστα του χρήστη
export default function ShoppingCartPage({ store, storeItems, allListItems, onClose }) {

  const merged = allListItems.map(listItem => {
    const found = storeItems.find(i => i.name === listItem.name)
    return {
      ...listItem,
      id: listItem.id || `list-${Math.random()}`,
      estimatedPrice: found?.price ?? null,  // τιμή PosoKanei, εκτίμηση
      scannedPrice: null,                    // πραγματική τιμή ραφιού
      scanned: false,
      checked: false,
      hasPrice: !!found,
      isExtra: false,
    }
  })

  const [cartItems, setCartItems] = useState(merged)
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState(null) // { name, scannedPrice, estimatedPrice, isNew }

  function toggleItem(id) {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function showFlash(data) {
    setFlash(data)
    setTimeout(() => setFlash(null), 3000)
  }

  async function handleBarcode(product) {
    setScanning(false)
    if (!product) return

    const fullName = `${product.brand || ''} ${product.name}`.trim()

    // Βρες την τιμή του συγκεκριμένου SM από retailer_prices
    const retailerPrice = product.retailer_prices?.find(
      rp => rp.retailer === store.retailer
    )?.price ?? product.price ?? null

    // Ψάξε αν υπάρχει ήδη στο cart
    const existingIdx = cartItems.findIndex(i =>
      i.id === product.id ||
      i.name?.toLowerCase().trim() === product.name?.toLowerCase().trim()
    )

    if (existingIdx >= 0) {
      // Υπάρχει → ενημέρωσε με πραγματική τιμή + τσεκάρισμα
      const existing = cartItems[existingIdx]
      setCartItems(prev => prev.map((i, idx) =>
        idx === existingIdx
          ? { ...i, scannedPrice: retailerPrice, scanned: true, checked: true }
          : i
      ))
      showFlash({
        name: fullName,
        scannedPrice: retailerPrice,
        estimatedPrice: existing.estimatedPrice,
        isNew: false,
      })
    } else {
      // Νέο προϊόν → προσθήκη με πραγματική τιμή
      const newItem = {
        ...product,
        name: product.name,
        brand: product.brand || '',
        id: product.id || `extra-${Math.random()}`,
        estimatedPrice: null,
        scannedPrice: retailerPrice,
        scanned: true,
        checked: true,
        hasPrice: !!retailerPrice,
        isExtra: true,
      }
      setCartItems(prev => [...prev, newItem])
      showFlash({
        name: fullName,
        scannedPrice: retailerPrice,
        estimatedPrice: null,
        isNew: true,
      })
    }
  }

  // Σύνολο: μόνο σκαναρισμένα (πραγματικές τιμές)
  const scannedItems = cartItems.filter(i => i.scanned && i.scannedPrice)
  const total = scannedItems.reduce((sum, i) => sum + i.scannedPrice, 0)
  const checkedCount = cartItems.filter(i => i.checked).length
  const scannedCount = scannedItems.length

  const unchecked = cartItems.filter(i => !i.checked)
  const checked = cartItems.filter(i => i.checked)

  return (
    <div className="cart-page">
      {/* Header */}
      <header className="cart-header">
        <button className="cart-back" onClick={onClose}>←</button>
        <div className="cart-header-center">
          <h1 className="cart-store-name">{store.name}</h1>
          <p className="cart-subtitle">{cartItems.length} προϊόντα</p>
        </div>
        <button className="cart-scan-btn" onClick={() => setScanning(true)} aria-label="Σκανάρισμα">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
            <line x1="8" y1="8" x2="8" y2="16"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="16" y1="8" x2="16" y2="16"/>
          </svg>
        </button>
      </header>

      {/* Scan flash */}
      {flash && (
        <div className={`scan-flash ${flash.isNew ? 'scan-flash--new' : 'scan-flash--found'}`}>
          <div className="scan-flash-name">
            {flash.isNew ? '✚' : '✓'} {flash.name}
          </div>
          {flash.scannedPrice != null && (
            <div className="scan-flash-price">
              €{flash.scannedPrice.toFixed(2)}
              {!flash.isNew && flash.estimatedPrice != null && flash.estimatedPrice !== flash.scannedPrice && (
                <span className="scan-flash-diff">
                  {' '}({flash.scannedPrice > flash.estimatedPrice ? '+' : ''}
                  €{(flash.scannedPrice - flash.estimatedPrice).toFixed(2)} vs Poso Kanei)
                </span>
              )}
            </div>
          )}
          {flash.scannedPrice == null && (
            <div className="scan-flash-price">Τιμή άγνωστη</div>
          )}
        </div>
      )}

      {/* Items */}
      <main className="cart-main">
        {groupByCategory(unchecked).map(([category, items]) => (
          <div key={category} className="cart-category">
            <div className="cart-category-label">{category}</div>
            {items.map(item => (
              <CartItem key={item.id} item={item} onToggle={toggleItem} />
            ))}
          </div>
        ))}

        {checked.length > 0 && (
          <div className="cart-checked-section">
            <div className="cart-checked-divider">
              Στο καλάθι ({checkedCount})
            </div>
            {groupByCategory(checked).map(([category, items]) => (
              <div key={category} className="cart-category cart-category--checked">
                <div className="cart-category-label">{category}</div>
                {items.map(item => (
                  <CartItem key={item.id} item={item} onToggle={toggleItem} />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="cart-footer">
        <div className="cart-total-row">
          <div>
            <div className="cart-total-label">
              {scannedCount > 0 ? `${scannedCount} σκαναρισμένα` : 'Σκανάρισε για σύνολο'}
            </div>
            {checkedCount > scannedCount && (
              <div className="cart-total-sublabel">
                +{checkedCount - scannedCount} χωρίς σάρωση
              </div>
            )}
          </div>
          <div className="cart-total-amount">
            {total > 0 ? `€${total.toFixed(2)}` : '—'}
          </div>
        </div>
      </footer>

      {scanning && (
        <BarcodeScanner onResult={handleBarcode} onClose={() => setScanning(false)} />
      )}
    </div>
  )
}

function CartItem({ item, onToggle }) {
  const priceDiff = item.scanned && item.scannedPrice != null && item.estimatedPrice != null
    ? item.scannedPrice - item.estimatedPrice
    : null

  return (
    <button
      className={`cart-item ${item.checked ? 'cart-item--checked' : ''} ${item.scanned ? 'cart-item--scanned' : ''}`}
      onClick={() => onToggle(item.id)}
    >
      <div className={`cart-checkbox ${item.checked ? 'cart-checkbox--checked' : ''} ${item.scanned ? 'cart-checkbox--scanned' : ''}`}>
        {item.checked && <span>✓</span>}
      </div>

      <div className="cart-item-info">
        <span className="cart-item-name">
          {item.brand ? `${item.brand} ` : ''}{item.name}
          {item.isExtra && <span className="cart-item-badge cart-item-badge--extra">+</span>}
        </span>
        {item.unit && (
          <span className="cart-item-unit">{item.unit_quantity} {item.unit}</span>
        )}
      </div>

      <div className="cart-item-price-col">
        {item.scanned ? (
          <>
            <span className="cart-item-price cart-item-price--real">
              {item.scannedPrice != null ? `€${item.scannedPrice.toFixed(2)}` : '—'}
            </span>
            {priceDiff !== null && priceDiff !== 0 && (
              <span className={`cart-price-diff ${priceDiff > 0 ? 'cart-price-diff--up' : 'cart-price-diff--down'}`}>
                {priceDiff > 0 ? '+' : ''}€{priceDiff.toFixed(2)}
              </span>
            )}
          </>
        ) : (
          <span className="cart-item-price cart-item-price--estimated">
            {item.estimatedPrice != null ? `~€${item.estimatedPrice.toFixed(2)}` : '—'}
          </span>
        )}
      </div>
    </button>
  )
}
