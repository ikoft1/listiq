import './ListItem.css'

export default function ListItem({ item, onToggle, onRemove }) {
  const fullName = [item.name, item.unit_quantity, item.unit].filter(Boolean).join(' ')

  return (
    <div className={`list-item ${item.checked ? 'checked' : ''}`}>
      <button
        className="item-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.checked ? 'Uncheck' : 'Check'}
      >
        {item.checked ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#16a34a"/>
            <path d="M7 12l4 4 6-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="1.5"/>
          </svg>
        )}
      </button>
      <div className="item-body">
        <span className="item-name">{fullName}</span>
        {item.store && (
          <span className="item-store">{item.store}</span>
        )}
      </div>
      {item.price && (
        <span className="item-price">€{item.price.toFixed(2)}</span>
      )}
      <button
        className="item-remove"
        onClick={() => onRemove(item.id)}
        aria-label="Remove"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}
