import { useState, useEffect, useRef } from 'react'
import { useList } from '../hooks/useList'
import { searchProducts, findBestStores } from '../lib/api'
import BarcodeScanner from '../components/BarcodeScanner'
import ShelfScanner from '../components/ShelfScanner'
import ListItem from '../components/ListItem'
import PriceModal from '../components/PriceModal'
import StoreRankingModal from '../components/StoreRankingModal'
import ShoppingCartPage from './ShoppingCartPage'
import './ListPage.css'

export default function ListPage() {
  const { items, addItem, toggleItem, removeItem, clearChecked, total, checkedCount } = useList()
  const [query, setQuery] = useState('')
  const [shelfScanning, setShelfScanning] = useState(false)
  const [results, setResults] = useState([])
  const [scanning, setScanning] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [storeRanking, setStoreRanking] = useState(null)
  const [findingStores, setFindingStores] = useState(false)

  // Shopping cart state
  const [shoppingCart, setShoppingCart] = useState(null) // { store, storeItems }

  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 3) {
      setResults([])
      setNoResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setResults([])
      setNoResults(false)
      setCurrentPage(1)
      setHasNext(false)
      try {
        const { products, hasNext: next } = await searchProducts(query, 1)
        if (products && products.length > 0) {
          setResults(products)
          setHasNext(next)
        } else {
          setNoResults(true)
        }
      } catch {
        setNoResults(true)
      }
      setSearching(false)
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function handleFindBestStores() {
    setFindingStores(true)
    const activeItems = items.filter(i => !i.checked)
    const stores = await findBestStores(activeItems)
    setStoreRanking(stores)
    setFindingStores(false)
  }

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = currentPage + 1
    try {
      const { products, hasNext: next } = await searchProducts(query, nextPage)
      setResults(prev => [...prev, ...products])
      setCurrentPage(nextPage)
      setHasNext(next)
    } catch {}
    setLoadingMore(false)
  }

  function handleAddResult(product) {
    console.log('product', product)
    addItem({
      ...product,
      name: `${product.brand} ${product.name}`.trim(),
    })
    setResults([])
    setQuery('')
    setSelectedProduct(null)
    setNoResults(false)
  }

  function handleAddManual() {
    if (!query.trim()) return
    addItem({ name: query })
    setQuery('')
    setResults([])
    setNoResults(false)
  }

  function handleBarcode(product) {
    setScanning(false)
    if (product) addItem(product)
  }

  // Όταν ο χρήστης επιλέξει SM από το ranking → άνοιξε το cart
  function handleStartShopping(store) {
    const activeItems = items.filter(i => !i.checked)
    setShoppingCart({ store, storeItems: store.items })
    setStoreRanking(null)
  }

  // Αν είναι σε shopping mode → εμφάνισε το cart
  if (shoppingCart) {
    return (
      <ShoppingCartPage
        store={shoppingCart.store}
        storeItems={shoppingCart.storeItems}
        allListItems={items.filter(i => !i.checked)}
        onClose={() => setShoppingCart(null)}
      />
    )
  }

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  return (
    <div className="list-page">
      <header className="list-header">
        <div className="header-top">
          <h1 className="logo">Listiq</h1>
          {checkedCount > 0 && (
            <div className="total-badge">
              {total > 0 ? `€${total.toFixed(2)}` : `${checkedCount} ✓`}
            </div>
          )}
        </div>

        <form className="search-form" onSubmit={e => { e.preventDefault(); handleAddManual() }}>
          <input
            className="search-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setNoResults(false) }}
            placeholder="Προσθήκη προϊόντος..."
            autoComplete="off"
          />
          <button type="submit" className="btn-search" disabled={searching}>
            {searching ? '...' : '+'}
          </button>
          <button
            type="button"
            className="btn-scan"
            onClick={() => setShelfScanning(true)}
            aria-label="Scan shelf label"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="7" width="18" height="10" rx="2"/>
              <path d="M7 7V5M12 7V5M17 7V5M7 17v2M12 17v2M17 17v2"/>
            </svg>
          </button>
          <button
            type="button"
            className="btn-scan"
            onClick={() => setScanning(true)}
            aria-label="Scan barcode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <line x1="8" y1="8" x2="8" y2="16"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="16" y1="8" x2="16" y2="16"/>
            </svg>
          </button>
        </form>

        {results.length > 0 && (
          <div className="search-results">
            {results.map(r => (
              <button key={r.id} className="result-row" onClick={() => handleAddResult(r)}>
                <div className="result-info">
                  <span className="result-name">{r.brand} {r.name}</span>
                </div>
                {r.price && <span className="result-price">από €{r.price?.toFixed(2)}</span>}
              </button>
            ))}
            {hasNext && (
              <button className="result-row result-loadmore" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? '...' : '↓ Περισσότερα αποτελέσματα'}
              </button>
            )}
            <button className="result-row result-manual" onClick={handleAddManual}>
              + Προσθήκη "{query}" χωρίς τιμή
            </button>
          </div>
        )}

        {noResults && (
          <div className="search-results">
            <div className="result-row" style={{ color: 'var(--text-secondary)', cursor: 'default' }}>
              Δεν βρέθηκαν αποτελέσματα για "{query}"
            </div>
            <button className="result-row result-manual" onClick={handleAddManual}>
              + Προσθήκη "{query}" χωρίς τιμή
            </button>
          </div>
        )}
      </header>

      <main className="list-main">
        {items.length === 0 && (
          <div className="empty-state">
            <p>Η λίστα σου είναι άδεια</p>
            <p>Πρόσθεσε προϊόντα ή σκανάρε barcode</p>
          </div>
        )}

        {unchecked.map(item => (
          <ListItem key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
        ))}

        {unchecked.length >= 2 && (
          <button
            className="btn-find-stores"
            onClick={handleFindBestStores}
            disabled={findingStores}
          >
            {findingStores ? '⏳ Ψάχνω τιμές...' : '🛒 Βρες καλύτερο SM'}
          </button>
        )}

        {checked.length > 0 && (
          <>
            <div className="checked-divider">
              <span>Αγοράστηκαν ({checked.length})</span>
              <button onClick={clearChecked} className="btn-clear">Καθαρισμός</button>
            </div>
            {checked.map(item => (
              <ListItem key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
            ))}
          </>
        )}
      </main>

      <footer className="donate-footer">
        <a href="https://paypal.me/YOURPAYPAL" target="_blank" rel="noopener noreferrer" className="donate-btn">
          ☕ Αν σου άρεσε, κέρασέ μας έναν καφέ
        </a>
      </footer>

      {scanning && (
        <BarcodeScanner onResult={handleBarcode} onClose={() => setScanning(false)} />
      )}

      {shelfScanning && (
        <ShelfScanner
          onResult={product => { addItem(product); setShelfScanning(false) }}
          onClose={() => setShelfScanning(false)}
        />
      )}

      {selectedProduct && (
        <PriceModal
          product={selectedProduct}
          onAdd={handleAddResult}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {storeRanking && (
        <StoreRankingModal
          stores={storeRanking}
          totalItems={unchecked.length}
          allListItems={unchecked}
          onClose={() => setStoreRanking(null)}
          onStartShopping={handleStartShopping}
        />
      )}
    </div>
  )
}
