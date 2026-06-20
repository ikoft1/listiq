import { useState, useEffect } from 'react'
import { getFavourites, removeFavourite } from '../hooks/useFavourites'
import './FavouritesModal.css'

export default function FavouritesModal({ onAdd, onClose }) {
  const [favourites, setFavourites] = useState(getFavourites())
  const [selected, setSelected] = useState({}) // id → true/false

  function toggleSelect(id) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleRemove(id) {
    setFavourites(removeFavourite(id))
    setSelected(prev => { const s = { ...prev }; delete s[id]; return s })
  }

  function handleAdd() {
    const toAdd = favourites.filter(f => selected[f.id])
    if (toAdd.length === 0) return
    onAdd(toAdd)
    onClose()
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="fav-overlay" onClick={onClose}>
      <div className="fav-modal" onClick={e => e.stopPropagation()}>
        <div className="fav-header">
          <h2 className="fav-title">⭐ Αγαπημένα</h2>
          <button className="fav-close" onClick={onClose}>✕</button>
        </div>

        {favourites.length === 0 ? (
          <div className="fav-empty">
            <p>Δεν έχεις αγαπημένα ακόμα</p>
            <p>Αποθήκευσε προϊόντα μετά τα ψώνια</p>
          </div>
        ) : (
          <>
            <div className="fav-list">
              {favourites.map(f => {
                const fullName = [f.name, f.unit_quantity, f.unit].filter(Boolean).join(' ')
                const isSelected = !!selected[f.id]
                return (
                  <div key={f.id} className={`fav-item ${isSelected ? 'fav-item--selected' : ''}`}>
                    <button className="fav-item-main" onClick={() => toggleSelect(f.id)}>
                      <div className={`fav-checkbox ${isSelected ? 'fav-checkbox--checked' : ''}`}>
                        {isSelected && <span>✓</span>}
                      </div>
                      <div className="fav-item-info">
                        <span className="fav-item-name">{fullName}</span>
                        {f.price && (
                          <span className="fav-item-price">~€{f.price.toFixed(2)}</span>
                        )}
                      </div>
                    </button>
                    <button className="fav-item-remove" onClick={() => handleRemove(f.id)} aria-label="Διαγραφή">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="fav-footer">
              <button
                className={`fav-add-btn ${selectedCount > 0 ? 'fav-add-btn--active' : ''}`}
                onClick={handleAdd}
                disabled={selectedCount === 0}
              >
                {selectedCount > 0
                  ? `+ Πρόσθεσε ${selectedCount} στη λίστα`
                  : 'Επίλεξε προϊόντα'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
