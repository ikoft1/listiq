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

export default function StoreRankingModal({ stores, totalItems, onClose }) {
  if (!stores) return null

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
            {stores.map((s, i) => (
              <div key={s.retailer} className={`ranking-store ${i === 0 ? 'ranking-best' : ''}`}>
                <div className="ranking-store-header">
                  <div className="rank-number">{i + 1}</div>
                  <div
                    className="store-dot"
                    style={{ background: STORE_COLORS[s.retailer] || '#999' }}
                  />
                  <span className="store-name">{s.name}</span>
                  <div className="store-right">
                    <span className="store-price">€{s.total.toFixed(2)}</span>
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
              </div>
            ))}
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
