import './PriceModal.css'

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
  marketin: '#009f4d',
}

export default function PriceModal({ product, onAdd, onClose }) {
  if (!product) return null

  const prices = [...(product.retailer_prices || [])]
    .sort((a, b) => a.price - b.price)

  const cheapest = prices[0]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-brand">{product.brand}</p>
            <h2 className="modal-name">{product.name}</h2>
          </div>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        {prices.length > 0 && (
          <div className="modal-cheapest">
            <span>Φτηνότερο</span>
            <span className="cheapest-store">{cheapest.retailer_display_name}</span>
            <span className="cheapest-price">€{cheapest.price.toFixed(2)}</span>
          </div>
        )}

        <div className="modal-prices">
          {prices.map(r => (
            <div key={r.retailer} className="price-row">
              <div
                className="store-dot"
                style={{ background: STORE_COLORS[r.retailer] || '#999' }}
              />
              <span className="store-name">{r.retailer_display_name}</span>
              {r.is_discount && <span className="discount-badge">Προσφορά</span>}
              <span className="store-price">€{r.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button
            className="btn-add-product"
            onClick={() => {
             onAdd({
  id: product.id,
  name: `${product.brand} ${product.name}`.trim(),
  price: cheapest?.price || null,
  store: cheapest?.retailer_display_name || null,
  retailer_prices: product.retailer_prices || [],
})
              onClose()
            }}
          >
            + Προσθήκη στη λίστα
          </button>
        </div>
      </div>
    </div>
  )
}
