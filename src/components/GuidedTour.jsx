import { useState, useEffect } from 'react'
import './GuidedTour.css'

const TOUR_STEPS = [
  {
    target: '.search-input',
    title: 'Βήμα 1 — Αναζήτηση προϊόντος',
    desc: 'Πάτα εδώ και γράψε ένα προϊόν, π.χ. "γάλα" ή "καφές". Επίλεξε από τα αποτελέσματα.',
    position: 'bottom',
  },
  {
    target: '.search-input',
    title: 'Βήμα 2 — Πρόσθεσε άλλο ένα',
    desc: 'Τέλεια! Χρειάζεσαι τουλάχιστον 2 προϊόντα για σύγκριση τιμών. Πρόσθεσε ένα ακόμα.',
    position: 'bottom',
  },
  {
    target: '.btn-find-stores',
    title: 'Βήμα 3 — Σύγκριση τιμών',
    desc: 'Τώρα πάτα εδώ για να βρεις ποιο σούπερ μάρκετ έχει τις φθηνότερες τιμές!',
    position: 'top',
  },
  {
    target: '.btn-save-list',
    title: 'Βήμα 4 — Αποθήκευση λίστας',
    desc: 'Πάτα εδώ για να αποθηκεύσεις και να κοινοποιήσεις τη λίστα σου!',
    position: 'bottom',
  },
]

export default function GuidedTour({ onDone, itemCount }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  // Ανανέωσε rect όταν αλλάζει το step
  useEffect(() => {
    function updateRect() {
      const el = document.querySelector(current.target)
      if (el) setRect(el.getBoundingClientRect())
      else setRect(null)
    }
    const timer = setTimeout(updateRect, 150)
    window.addEventListener('resize', updateRect)
    return () => { clearTimeout(timer); window.removeEventListener('resize', updateRect) }
  }, [step])

  // Βήμα 0 → 1 όταν itemCount >= 1
  useEffect(() => {
    if (step === 0 && itemCount >= 1) setStep(1)
  }, [itemCount, step])

  // Βήμα 1 → 2 όταν itemCount >= 2
  useEffect(() => {
    if (step === 1 && itemCount >= 2) setStep(2)
  }, [itemCount, step])

  // Βήμα 2: άκουσε κλικ στο btn-find-stores
  useEffect(() => {
    if (step !== 2) return
    const el = document.querySelector('.btn-find-stores')
    if (!el) return
    function handler() { setTimeout(() => setStep(3), 300) }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [step])

  const PADDING = 8

  const spotStyle = rect ? {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  } : null

  const tooltipStyle = rect ? (
    current.position === 'bottom'
      ? { top: rect.bottom + PADDING + 8, left: Math.max(12, Math.min(rect.left, window.innerWidth - 320 - 12)) }
      : { bottom: window.innerHeight - rect.top + PADDING + 8, left: Math.max(12, Math.min(rect.left, window.innerWidth - 320 - 12)) }
  ) : { top: '40%', left: '50%', transform: 'translateX(-50%)' }

  return (
    <div className="tour-overlay">
      {spotStyle && <div className="tour-spotlight" style={spotStyle} />}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-step-badge">{step + 1} / {TOUR_STEPS.length}</div>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-desc">{current.desc}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onDone}>Παράλειψη οδηγού</button>
          {(step === 3) && (
            <button className="tour-next" onClick={onDone}>✓ Τέλος</button>
          )}
        </div>
      </div>
    </div>
  )
}
