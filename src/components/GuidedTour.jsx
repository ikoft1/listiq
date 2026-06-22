import { useState, useEffect, useRef } from 'react'
import './GuidedTour.css'

const TOUR_STEPS = [
  {
    target: '.search-input',
    title: 'Βήμα 1 — Αναζήτηση προϊόντος',
    desc: 'Πάτα εδώ και γράψε ένα προϊόν, π.χ. "γάλα" ή "καφές". Επίλεξε από τα αποτελέσματα.',
    position: 'bottom',
    waitForAction: true, // περιμένει να προσθέσει item
  },
  {
    target: '.search-input',
    title: 'Βήμα 2 — Πρόσθεσε άλλο ένα',
    desc: 'Τέλεια! Χρειάζεσαι τουλάχιστον 2 προϊόντα για σύγκριση τιμών. Πρόσθεσε ένα ακόμα.',
    position: 'bottom',
    waitForAction: true,
  },
  {
    target: '.btn-find-stores',
    title: 'Βήμα 3 — Σύγκριση τιμών',
    desc: 'Πάτα εδώ για να βρεις ποιο σούπερ μάρκετ έχει τις φθηνότερες τιμές για τη λίστα σου!',
    position: 'top',
    waitForAction: true,
  },
  {
    target: '.btn-save-list',
    title: 'Βήμα 4 — Αποθήκευση λίστας',
    desc: 'Πάτα εδώ για να αποθηκεύσεις και να κοινοποιήσεις τη λίστα σου με την οικογένειά σου.',
    position: 'bottom',
    waitForAction: false,
  },
]

export default function GuidedTour({ onDone, itemCount }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const prevItemCount = useRef(itemCount)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  // Βρες το target element και υπολόγισε το rect
  useEffect(() => {
    function updateRect() {
      const el = document.querySelector(current.target)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect(r)
      }
    }
    // Μικρό delay για να σιγουρευτούμε ότι το DOM είναι έτοιμο
    const timer = setTimeout(updateRect, 100)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [step])

  // Βήμα 1 & 2: παρατήρησε πότε προστέθηκε item
  useEffect(() => {
    if (step === 0 && itemCount > prevItemCount.current) {
      prevItemCount.current = itemCount
      setStep(1)
    } else if (step === 1 && itemCount > prevItemCount.current) {
      prevItemCount.current = itemCount
      setStep(2)
    }
  }, [itemCount])

  // Βήμα 3: παρατήρησε κλικ στο btn-find-stores
  useEffect(() => {
    if (step !== 2) return
    const el = document.querySelector('.btn-find-stores')
    if (!el) return
    function handler() { setStep(3) }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [step])

  if (!rect) return (
    <div className="tour-overlay">
      <div className="tour-tooltip" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
        <div className="tour-step-badge">{step + 1} / {TOUR_STEPS.length}</div>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-desc">{current.desc}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onDone}>Παράλειψη οδηγού</button>
        </div>
      </div>
    </div>
  )

  const PADDING = 8
  const spotStyle = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  // Υπολόγισε tooltip position
  const tooltipStyle = {}
  if (current.position === 'bottom') {
    tooltipStyle.top = rect.bottom + PADDING + 8
    tooltipStyle.left = Math.max(12, Math.min(rect.left, window.innerWidth - 320 - 12))
  } else {
    tooltipStyle.bottom = window.innerHeight - rect.top + PADDING + 8
    tooltipStyle.left = Math.max(12, Math.min(rect.left, window.innerWidth - 320 - 12))
  }

  return (
    <div className="tour-overlay">
      {/* Spotlight cutout */}
      <div className="tour-spotlight" style={spotStyle} />

      {/* Tooltip */}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-step-badge">{step + 1} / {TOUR_STEPS.length}</div>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-desc">{current.desc}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onDone}>Παράλειψη οδηγού</button>
          {(!current.waitForAction || isLast) && (
            <button className="tour-next" onClick={isLast ? onDone : () => setStep(s => s + 1)}>
              {isLast ? '✓ Τέλος' : 'Επόμενο →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
