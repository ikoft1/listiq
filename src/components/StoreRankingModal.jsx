import './StoreRankingModal.css'

const STORE_COLORS = {
  sklavenitis: '#e8251f',
  ab_vasilopoulos: '#005bab',
  lidl: '#0050aa',
  mymarket: '#00a650',
  masoutis: '#f47920',
  galaxias: '#6a1f8a',
  halkiadakis: '#e30613',
  kritikos: '#003087',
  synka: '#e2001a',
  market_in: '#009f4d',
}

function getCommonItems(stores) {
  if (!stores.length) return []
  const allNames = [...new Set(stores.flatMap(s => s.items.map(i => i.name)))]
  return allNames.filter(name =>
    stores.every(s => s.items.find(i => i.name === name))
  )
}

export default function StoreRankingModal({ stores, totalItems, allListItems, onClose, onStartShopping }) {
  if (!stores) return null

  const commonItems = getCommonItems(stores)

  function handleStartShopping(store) {
    onStartShopping(store)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-name">🛒 Καλύτερο Σούπερ Μάρκετ</h2>
            <p className="modal-brand">Για {totalItems} προϊόντα της λίστας σου</p>
          </div>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        {stores.length === 0 ? (
          <div className="ranking-empty">
            Δεν βρέθηκαν τιμές για τα προϊόντα σου
          </div>
        ) : (
          <div className="ranking-stores">
            {stores.map((s, i) => {
              const commonTotal = commonItems.length > 0
                ? commonItems.reduce((sum, name) => {
                    const item = s.items.find(i => i.name === name)
                    return sum + (item?.price || 0)
                  }, 0)
                : null

              return (
                <div key={s.retailer} className={`ranking-store ${i === 0 ? 'ranking-best' : ''}`}>
                  <div className="ranking-store-header">
                    <div className="rank-number">{i + 1}</div>
                    <div
                      className="store-dot"
                      style={{ background: STORE_COLORS[s.retailer] || '#999' }}
                    />
                    <span className="store-name">{s.name}</span>
                    <div className="store-right">
                      <div className="store-prices-row">
                        <span className="store-price">€{s.total.toFixed(2)}</span>
                        {commonItems.length > 0 && commonItems.length < s.found && (
                          <span className="store-common-price">
                            κοινά: €{commonTotal.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="store-coverage">{s.found}/{totalItems} προϊ.</span>
                    </div>
                  </div>

                  <div className="ranking-items">
                    {s.items.map((item, j) => (
                      <div key={j} className="ranking-item found">
                        <span className="ranking-item-check">✓</span>
                        <span className="ranking-item-name">{item.name}</span>
                        <span className="ranking-item-price">€{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {s.missing.map((name, j) => (
                      <div key={j} className="ranking-item missing">
                        <span className="ranking-item-check">✕</span>
                        <span className="ranking-item-name">{name}</span>
                        <span className="ranking-item-price">—</span>
                      </div>
                    ))}
                  </div>

                  {/* Κουμπί "Πάμε για ψώνια" */}
                  <button
                    className={`btn-start-shopping ${i === 0 ? 'btn-start-shopping--best' : ''}`}
                    onClick={() => handleStartShopping(s)}
                  >
                    🛍️ Πάμε για ψώνια στο {s.name}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-add-product" onClick={onClose}>
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  )
}
