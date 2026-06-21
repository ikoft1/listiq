import { useState, useEffect, useRef } from 'react'
import { useList } from '../hooks/useList'
import { searchProducts, findBestStores, refreshItemPrices } from '../lib/api'
import ListItem from '../components/ListItem'
import PriceModal from '../components/PriceModal'
import StoreRankingModal from '../components/StoreRankingModal'
import ShoppingCartPage from './ShoppingCartPage'
import FavouritesModal from '../components/FavouritesModal'
import OnboardingPage from './OnboardingPage'
import ListsModal from '../components/ListsModal'
import './ListPage.css'

export default function ListPage({ onSignOut }) {
  const { items, addItem, toggleItem, removeItem, updateItem, clearChecked, clearAll, total, checkedCount, user, lists, listId, listName, inviteCode, createList, switchToList, joinList, renameList, deleteList } = useList()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [storeRanking, setStoreRanking] = useState(null)
  const [findingStores, setFindingStores] = useState(false)
  const [shoppingCart, setShoppingCart] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshToast, setRefreshToast] = useState(null)
  const [showFavourites, setShowFavourites] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showLists, setShowLists] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(() => {
    return localStorage.getItem('listiq_onboarding_done') === 'true'
  })

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

  async function handleRefreshPrices() {
    setRefreshing(true)
    const updated = await refreshItemPrices(items)
    let changedCount = 0
    updated.forEach(item => {
      const original = items.find(i => i.id === item.id)
      if (original && (
        original.price !== item.price ||
        JSON.stringify(original.retailer_prices) !== JSON.stringify(item.retailer_prices)
      )) {
        updateItem(item.id, { price: item.price, retailer_prices: item.retailer_prices })
        changedCount++
      }
    })
    setRefreshing(false)
    setRefreshToast(changedCount > 0 ? `✅ Ανανεώθηκαν ${changedCount} τιμές` : '✅ Οι τιμές είναι ενημερωμένες')
    setTimeout(() => setRefreshToast(null), 3000)
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
    addItem({ ...product, name: `${product.brand} ${product.name}`.trim() })
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

  function handleStartShopping(store) {
    setShoppingCart({ store, storeItems: store.items })
    setStoreRanking(null)
  }

  function handleShare() {
    const activeItems = items.filter(i => !i.checked)
    if (!activeItems.length) return
    const lines = activeItems.map(i => {
      const price = i.price ? ` ~€${i.price.toFixed(2)}` : ''
      return `• ${i.name}${price}`
    })
    const totalPrice = activeItems.filter(i => i.price).reduce((sum, i) => sum + i.price, 0)
    const totalLine = totalPrice > 0 ? `\nΣύνολο: ~€${totalPrice.toFixed(2)}` : ''
    const text = `🛒 Λίστα αγορών\n\n${lines.join('\n')}${totalLine}\n\ngolistiq.com`
    if (navigator.share) {
      navigator.share({ title: 'Λίστα αγορών - Listiq', text })
    } else {
      navigator.clipboard.writeText(text)
      setRefreshToast('✅ Αντιγράφηκε στο clipboard!')
      setTimeout(() => setRefreshToast(null), 3000)
    }
  }

  // Migration: μεταφορά guest items στο Supabase μετά το login
  useEffect(() => {
    if (user && listId && items.length > 0) {
      const guestItems = JSON.parse(localStorage.getItem('listiq_guest_items') || '[]')
      if (guestItems.length > 0) {
        guestItems.forEach(item => addItem(item))
        localStorage.removeItem('listiq_guest_items')
      }
    }
  }, [user, listId])

  // Save guest items πριν το login
  function handleSaveList() {
    if (!user) {
      // Αποθήκευσε τα τρέχοντα items ως guest items
      localStorage.setItem('listiq_guest_items', JSON.stringify(items))
      setShowLists(true)
    } else {
      setShowLists(true)
    }
  }

  if (!onboardingDone) {
    return (
      <OnboardingPage onDone={() => {
        localStorage.setItem('listiq_onboarding_done', 'true')
        setOnboardingDone(true)
      }} />
    )
  }

  if (shoppingCart) {
    return (
      <ShoppingCartPage
        store={shoppingCart.store}
        storeItems={shoppingCart.storeItems}
        allListItems={items.filter(i => !i.checked)}
        onClose={() => setShoppingCart(null)}
        onNewList={() => { clearAll(); setShoppingCart(null) }}
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

          {/* Αποθήκευση λίστας — πάντα ορατό */}
          <button className="btn-save-list" onClick={handleSaveList} title="Αποθήκευση & κοινοποίηση λίστας">
            {user ? (listName || 'Λίστα μου') + ' ▾' : '💾 Αποθήκευση'}
          </button>

          <button className="btn-help" onClick={() => setShowHelp(true)} title="Βοήθεια">?</button>
          <button className="btn-refresh" onClick={handleRefreshPrices} disabled={refreshing} title="Ανανέωση τιμών">
            {refreshing ? '⏳' : '🔄'}
          </button>
          <button className="btn-favourites" onClick={() => setShowFavourites(true)} title="Αγαπημένα προϊόντα">⭐</button>
          {items.filter(i => !i.checked).length > 0 && (
            <button className="btn-share" onClick={handleShare} title="Κοινοποίηση λίστας">📤</button>
          )}

          {/* Avatar με menu */}
          {user && (
            <div className="user-menu-wrap">
              <button className="btn-user" onClick={() => setShowUserMenu(v => !v)} title={user.email}>
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} className="user-avatar" alt="avatar" />
                  : <span className="user-initials">{(user.email || '?')[0].toUpperCase()}</span>
                }
              </button>
              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-email">{user.email}</div>
                 <button className="user-menu-item" onClick={() => { setShowUserMenu(false); setShowLists(true) }}>
                    📋 Οι λίστες μου
                  </button>
                <button className="user-menu-item user-menu-item--danger" onClick={() => { setShowUserMenu(false); onSignOut() }}>
                    🚪 Αποσύνδεση
                  </button>
                </div>
              )}
            </div>
          )}

          {checkedCount > 0 && (
            <div className="total-badge">
              {total > 0 ? `€${total.toFixed(2)}` : `${checkedCount} ✓`}
            </div>
          )}
        </div>

        {refreshToast && <div className="refresh-toast">{refreshToast}</div>}

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
            <p>Πρόσθεσε προϊόντα με αναζήτηση</p>
          </div>
        )}

        {unchecked.map(item => (
          <ListItem key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} onUpdateQuantity={(id, qty) => updateItem(id, { quantity: qty })} />
        ))}

        {unchecked.length >= 2 && (
          <button className="btn-find-stores" onClick={handleFindBestStores} disabled={findingStores}>
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
        <a href="https://paypal.me/kofteridis" target="_blank" rel="noopener noreferrer" className="donate-btn">
          ☕ Αν σου άρεσε, κέρασέ μας έναν καφέ
        </a>
        <div className="footer-links">
          <a href="/privacy.html" target="_blank">Πολιτική Απορρήτου</a>
          <span>·</span>
          <a href="/terms.html" target="_blank">Όροι Χρήσης</a>
        </div>
      </footer>

      {selectedProduct && (
        <PriceModal product={selectedProduct} onAdd={handleAddResult} onClose={() => setSelectedProduct(null)} />
      )}

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <OnboardingPage onDone={() => setShowHelp(false)} isModal />
          </div>
        </div>
      )}

      {showLists && (
        <ListsModal
          lists={lists}
          listId={listId}
          listName={listName}
          inviteCode={inviteCode}
          user={user}
          onSwitch={switchToList}
          onCreate={createList}
          onJoin={joinList}
          onRename={renameList}
          onDelete={deleteList}
          onClose={() => setShowLists(false)}
        />
      )}

      {showFavourites && (
        <FavouritesModal
          onAdd={products => products.forEach(p => addItem(p))}
          onClose={() => setShowFavourites(false)}
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

      {/* Click outside για user menu */}
      {showUserMenu && (
        <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} />
      )}
    </div>
  )
}
