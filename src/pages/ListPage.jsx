import { useState } from 'react'
import { useList } from '../hooks/useList'
import { searchProducts } from '../lib/api'
import BarcodeScanner from '../components/BarcodeScanner'
import ShelfScanner from '../components/ShelfScanner'
import ListItem from '../components/ListItem'
import './ListPage.css'

export default function ListPage() {
  const { items, addItem, toggleItem, removeItem, clearChecked, total, checkedCount } = useList()
  const [query, setQuery] = useState('')
  const [shelfScanning, setShelfScanning] = useState(false)
  const [results, setResults] = useState([])
  const [scanning, setScanning] = useState(false)
  const [searching, setSearching] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    try {
      const found = await searchProducts(query)
      if (found && found.length > 0) {
        setResults(found.slice(0, 8))
      } else {
        addItem({ name: query })
        setQuery('')
      }
    } catch {
      addItem({ name: query })
      setQuery('')
    }
    setSearching(false)
  }

  function handleAddResult(product) {
    addItem(product)
    setResults([])
    setQuery('')
  }

  function handleAddManual() {
    if (!query.trim()) return
    addItem({ name: query })
    setQuery('')
    setResults([])
  }

  function handleBarcode(product) {
    setScanning(false)
    if (product) addItem(product)
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

        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
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
            title="Σκανάρισμα ετικέτας ραφιού"
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
            title="Σκανάρισμα barcode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <line x1="8" y1="8" x2="8" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="16" y1="8" x2="16" y2="16"/>
            </svg>
          </button>
        </form>

        {results.length > 0 && (
          <div className="search-results">
            {results.map(r => (
              <button key={r.id} className="result-row" onClick={() => handleAddResult(r)}>
                <div className="result-info">
                  <span className="result-name">{r.name}</span>
                  {r.brand && <span className="result-brand">{r.brand}</span>}
                </div>
                {r.price && <span className="result-price">από €{r.price?.toFixed(2)}</span>}
              </button>
            ))}
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
    </div>
  )
}
