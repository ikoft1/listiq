import { useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'
import { addFavourites } from '../hooks/useFavourites'
import { searchProducts } from '../lib/api'
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

// Numpad modal για εισαγωγή τιμής ραφιού

function CheckoutModal({ estimatedTotal, shelfTotal, estimatedMissing, shelfMissing, onNewList, onContinue, onSaveFavourites, saved }) {
  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        <div className="checkout-icon">🛒</div>
        <h2 className="checkout-title">Τελείωσες;</h2>

        <div className="checkout-totals">
          <div className="checkout-total-col">
            <div className="checkout-total-label">~Εκτίμηση</div>
            <div className="checkout-total-amount">{estimatedTotal > 0 ? `€${estimatedTotal.toFixed(2)}` : '—'}</div>
            {estimatedMissing > 0 && <div className="checkout-total-missing">+{estimatedMissing} χωρίς τιμή</div>}
          </div>
          <div className="checkout-divider" />
          <div className="checkout-total-col">
            <div className="checkout-total-label">Τιμή ραφιού</div>
            <div className="checkout-total-amount checkout-total-amount--shelf">{shelfTotal > 0 ? `€${shelfTotal.toFixed(2)}` : '—'}</div>
            {shelfMissing > 0 && <div className="checkout-total-missing">+{shelfMissing} χωρίς τιμή</div>}
          </div>
        </div>

        <button className="checkout-btn checkout-btn--secondary" onClick={onContinue}>
          + Πρόσθεσε κάτι ακόμα
        </button>
        <button
          className={`checkout-btn checkout-btn--fav ${saved ? 'checkout-btn--fav-saved' : ''}`}
          onClick={onSaveFavourites}
          disabled={saved}
        >
          {saved ? '✅ Αποθηκεύτηκαν!' : '⭐ Αποθήκευση ως αγαπημένα'}
        </button>
        <button className="checkout-btn checkout-btn--primary" onClick={onNewList}>
          🛒 Νέα λίστα
        </button>
      </div>
    </div>
  )
}

function PriceInputModal({ item, onSave, onClose }) {
  const [value, setValue] = useState(item.shelfPrice != null ? String(item.shelfPrice) : '')

  function handleKey(k) {
    if (k === '⌫') {
      setValue(v => v.slice(0, -1))
    } else if (k === '.') {
      if (!value.includes('.')) setValue(v => v + '.')
    } else {
      // max 6 chars
      if (value.length < 6) setValue(v => v + k)
    }
  }

  function handleSave() {
    const num = parseFloat(value)
    onSave(isNaN(num) ? null : num)
  }

  function handleClear() {
    onSave(null)
    onClose()
  }

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫']

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal" onClick={e => e.stopPropagation()}>
        <div className="price-modal-header">
          <span className="price-modal-name">{item.brand ? `${item.brand} ` : ''}{item.name}</span>
          <button className="price-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="price-modal-display">
          {value ? `€${value}` : <span className="price-modal-placeholder">0.00</span>}
        </div>

        <div className="price-modal-hint">Τιμή ραφιού</div>

        <div className="numpad">
          {keys.map(k => (
            <button key={k} className={`numpad-key ${k === '⌫' ? 'numpad-key--back' : ''}`} onClick={() => handleKey(k)}>
              {k}
            </button>
          ))}
        </div>

        <div className="price-modal-actions">
          <button className="price-modal-clear" onClick={handleClear}>Διαγραφή</button>
          <button className="price-modal-save" onClick={handleSave}>Αποθήκευση</button>
        </div>
      </div>
    </div>
  )
}

export default function ShoppingCartPage({ store, storeItems, allListItems, onClose }) {
  const merged = allListItems.map(listItem => {
    // Βρες τιμή απευθείας από retailer_prices του item για το συγκεκριμένο SM
    const retailerPrice = listItem.retailer_prices?.find(
      rp => rp.retailer === store.retailer
    )?.price ?? null

    // Fallback: ψάξε στο storeItems με name matching
    const found = retailerPrice == null
      ? storeItems.find(i => i.name?.toLowerCase().includes(listItem.name?.toLowerCase().split(' ').slice(0,3).join(' ').toLowerCase()))
      : null

    const estimatedPrice = retailerPrice ?? found?.price ?? null

    return {
      ...listItem,
      id: listItem.id || `list-${Math.random()}`,
      estimatedPrice,
      shelfPrice: null,
      checked: false,
      isExtra: false,
    }
  })

  const [cartItems, setCartItems] = useState(merged)
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [favouritesSaved, setFavouritesSaved] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchDebounce = useState(null)

  function handleSaveFavourites() {
    addFavourites(cartItems)
    setFavouritesSaved(true)
  }

  async function handleSearch(q) {
    setSearchQuery(q)
    setSearchResults([])
    if (!q.trim() || q.trim().length < 3) return
    setSearching(true)
    try {
      const { products } = await searchProducts(q, 1)
      setSearchResults(products || [])
    } catch {}
    setSearching(false)
  }

  function handleAddFromSearch(product) {
    const fullName = `${product.brand} ${product.name}`.trim()
    const retailerPrice = product.retailer_prices?.find(
      rp => rp.retailer === store.retailer
    )?.price ?? product.price ?? null

    const newItem = {
      ...product,
      name: product.name,
      brand: product.brand || '',
      id: product.id || `extra-${Math.random()}`,
      estimatedPrice: retailerPrice,
      shelfPrice: null,
      checked: false,
      isExtra: true,
    }
    setCartItems(prev => [...prev, newItem])
    setSearchQuery('')
    setSearchResults([])
  }

  function toggleItem(id) {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function handleLongPress(item) {
    setEditingItem(item)
  }

  function handleSavePrice(price) {
    setCartItems(prev => prev.map(i =>
      i.id === editingItem.id ? { ...i, shelfPrice: price } : i
    ))
    setEditingItem(null)
  }

  function showFlash(data) {
    setFlash(data)
    setTimeout(() => setFlash(null), 2500)
  }

  async function handleBarcode(product) {
    setScanning(false)
    if (!product) return

    const fullName = `${product.brand || ''} ${product.name}`.trim()
    const existingIdx = cartItems.findIndex(i =>
      i.id === product.id ||
      i.name?.toLowerCase().trim() === product.name?.toLowerCase().trim()
    )

    if (existingIdx >= 0) {
      setCartItems(prev => prev.map((i, idx) =>
        idx === existingIdx ? { ...i, checked: true } : i
      ))
      showFlash({ name: fullName, isNew: false })
    } else {
      const newItem = {
        ...product,
        name: product.name,
        brand: product.brand || '',
        id: product.id || `extra-${Math.random()}`,
        estimatedPrice: product.price || null,
        shelfPrice: null,
        checked: true,
        isExtra: true,
      }
      setCartItems(prev => [...prev, newItem])
      showFlash({ name: fullName, isNew: true })
    }
  }

  const checkedItems = cartItems.filter(i => i.checked)

  // Στήλη 1: εκτίμηση PosoKanei
  const estimatedTotal = checkedItems.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0)
  const estimatedMissing = checkedItems.filter(i => i.estimatedPrice == null).length

  // Στήλη 2: τιμές ραφιού (μόνο αυτά που έχουν shelfPrice)
  const shelfTotal = checkedItems.reduce((sum, i) => sum + (i.shelfPrice || 0), 0)
  const shelfMissing = checkedItems.filter(i => i.shelfPrice == null).length

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

      {/* Search bar */}
      <div className="cart-search-bar">
        <input
          className="cart-search-input"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Προσθήκη προϊόντος..."
          autoComplete="off"
        />
        {searching && <span className="cart-search-spinner">...</span>}
        {searchResults.length > 0 && (
          <div className="cart-search-results">
            {searchResults.map(r => (
              <button key={r.id} className="cart-search-result-row" onClick={() => handleAddFromSearch(r)}>
                <span className="cart-search-result-name">{r.brand} {r.name} {r.unit_quantity} {r.unit}</span>
                {r.price && <span className="cart-search-result-price">~€{r.price.toFixed(2)}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flash */}
      {flash && (
        <div className={`scan-flash ${flash.isNew ? 'scan-flash--new' : 'scan-flash--found'}`}>
          {flash.isNew ? '✚ Προστέθηκε: ' : '✓ Βρέθηκε: '}<strong>{flash.name}</strong>
        </div>
      )}

      {/* Items */}
      <main className="cart-main">
        {groupByCategory(unchecked).map(([category, items]) => (
          <div key={category} className="cart-category">
            <div className="cart-category-label">{category}</div>
            {items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onLongPress={handleLongPress}
              />
            ))}
          </div>
        ))}

        {checked.length > 0 && (
          <div className="cart-checked-section">
            <div className="cart-checked-divider">Στο καλάθι ({checkedItems.length})</div>
            {groupByCategory(checked).map(([category, items]) => (
              <div key={category} className="cart-category cart-category--checked">
                <div className="cart-category-label">{category}</div>
                {items.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onLongPress={handleLongPress}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {cartItems.length === 0 && (
          <div className="cart-empty"><p>Δεν υπάρχουν προϊόντα</p></div>
        )}
      </main>

      {/* Footer — 2 στήλες */}
      <footer className="cart-footer">
        <div className="cart-totals">
          <div className="cart-total-col">
            <div className="cart-total-label">~Εκτίμηση</div>
            <div className="cart-total-amount">
              {estimatedTotal > 0 ? `€${estimatedTotal.toFixed(2)}` : '—'}
            </div>
            {estimatedMissing > 0 && checkedItems.length > 0 && (
              <div className="cart-total-missing">+{estimatedMissing} χωρίς τιμή</div>
            )}
          </div>

          <div className="cart-total-divider" />

          <div className="cart-total-col">
            <div className="cart-total-label">Τιμή ραφιού</div>
            <div className="cart-total-amount cart-total-amount--shelf">
              {shelfTotal > 0 ? `€${shelfTotal.toFixed(2)}` : '—'}
            </div>
            {checkedItems.length > 0 && (
              <div className="cart-total-missing">
                {shelfMissing > 0 ? `+${shelfMissing} χωρίς τιμή` : '✓ Όλα έχουν τιμή'}
              </div>
            )}
          </div>
        </div>
        {checkedItems.length === 0 && (
          <div className="cart-footer-hint">Tick ή σκανάρισε προϊόντα • Πάτα ✏️ για τιμή ραφιού</div>
        )}
        {checkedItems.length > 0 && (
          <button className="cart-done-btn" onClick={() => setShowCheckout(true)}>
            ✅ Τελείωσα
          </button>
        )}
      </footer>

      {/* Numpad modal */}
      {editingItem && (
        <PriceInputModal
          item={editingItem}
          onSave={handleSavePrice}
          onClose={() => setEditingItem(null)}
        />
      )}

      {scanning && (
        <BarcodeScanner onResult={handleBarcode} onClose={() => setScanning(false)} />
      )}

      {showCheckout && (
        <CheckoutModal
          estimatedTotal={estimatedTotal}
          shelfTotal={shelfTotal}
          estimatedMissing={estimatedMissing}
          shelfMissing={shelfMissing}
          onNewList={() => { onClose(); }}
          onContinue={() => setShowCheckout(false)}
          onSaveFavourites={handleSaveFavourites}
          saved={favouritesSaved}
        />
      )}
    </div>
  )
}

function CartItem({ item, onToggle, onLongPress }) {
  // Πλήρες όνομα: name (ήδη περιέχει brand) + unit_quantity + unit
  const fullName = [
    item.name,
    item.unit_quantity,
    item.unit,
  ].filter(Boolean).join(' ')

  return (
    <div className={`cart-item ${item.checked ? 'cart-item--checked' : ''}`}>
      <button className="cart-item-main" onClick={() => onToggle(item.id)}>
        <div className={`cart-checkbox ${item.checked ? 'cart-checkbox--checked' : ''}`}>
          {item.checked && <span>✓</span>}
        </div>
        <div className="cart-item-info">
          <span className="cart-item-name">
            {fullName}
            {item.isExtra && <span className="cart-item-badge">+</span>}
          </span>
          <div className="cart-item-prices-row">
            <span className="cart-item-price--estimated">
              {item.estimatedPrice != null ? `~€${item.estimatedPrice.toFixed(2)}` : '—'}
            </span>
            {item.shelfPrice != null && (
              <>
                <span className="cart-item-price--sep">→</span>
                <span className="cart-item-price--shelf">€{item.shelfPrice.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      </button>
      <button className="cart-item-edit" onClick={() => onLongPress(item)} aria-label="Τιμή ραφιού">
        ✏️
      </button>
    </div>
  )
}
