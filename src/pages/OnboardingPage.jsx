import { useState, useEffect } from 'react'
import './OnboardingPage.css'

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Καλωσήρθες στο Listiq!',
    desc: 'Η έξυπνη λίστα αγορών που συγκρίνει τιμές σε όλα τα σούπερ μάρκετ. Θα σου δείξουμε πώς λειτουργεί σε 4 βήματα.',
    target: null,
  },
  {
    id: 'search',
    emoji: '🔍',
    title: 'Πρόσθεσε προϊόντα',
    desc: 'Πάτα στο πεδίο αναζήτησης και γράψε ένα προϊόν, π.χ. "γάλα" ή "καφές". Επίλεξε από τα αποτελέσματα.',
    target: 'search-input',
    arrow: 'down',
  },
  {
    id: 'add-more',
    emoji: '➕',
    title: 'Πρόσθεσε τουλάχιστον 2',
    desc: 'Για να συγκρίνεις τιμές χρειάζεσαι τουλάχιστον 2 προϊόντα στη λίστα. Πρόσθεσε κι άλλο ένα!',
    target: 'search-input',
    arrow: 'down',
  },
  {
    id: 'compare',
    emoji: '📊',
    title: 'Βρες το φθηνότερο SM',
    desc: 'Πάτα "🛒 Βρες καλύτερο SM" και το Listiq θα συγκρίνει τιμές σε Σκλαβενίτη, ΑΒ, Lidl, Μασούτη και άλλα.',
    target: 'btn-find-stores',
    arrow: 'up',
  },
  {
    id: 'shopping',
    emoji: '🏪',
    title: 'Πήγαινε για ψώνια',
    desc: 'Επίλεξε σούπερ μάρκετ και ξεκίνα. Τσεκάρισε κάθε προϊόν όταν το βάλεις στο καλάθι.',
    target: null,
  },
  {
    id: 'shelf-price',
    emoji: '🏷️',
    title: 'Βάλε τιμή ραφιού',
    desc: 'Στο καλάθι, γράψε την πραγματική τιμή από το ράφι για να έχεις ακριβές σύνολο. Πάτα ✏️ δίπλα σε κάθε προϊόν.',
    target: null,
  },
  {
    id: 'save',
    emoji: '💾',
    title: 'Αποθήκευση & Κοινοποίηση',
    desc: 'Πάτα "💾 Αποθήκευση" για να αποθηκεύσεις τη λίστα σου. Μπορείς να την κοινοποιήσεις με την οικογένειά σου!',
    target: 'btn-save-list',
    arrow: 'down',
  },
]

export default function OnboardingPage({ onDone, isModal }) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    if (current.target) {
      const el = document.querySelector(`.${current.target}`) ||
                 document.querySelector(`[class*="${current.target}"]`) ||
                 document.getElementById(current.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
      } else {
        setTargetRect(null)
      }
    } else {
      setTargetRect(null)
    }
  }, [step])

  function handleNext() {
    if (isLast) {
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className={`onboarding ${isModal ? 'onboarding--modal' : ''}`}>
      {/* Spotlight overlay */}
      {targetRect && (
        <div className="onboarding-spotlight" style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }} />
      )}

      <div className="onboarding-inner">
        {/* Logo */}
        {!isModal && (
          <div className="onboarding-logo">
            <span className="onboarding-logo-text">Listiq</span>
          </div>
        )}

        {/* Progress */}
        <div className="onboarding-progress">
          <div className="onboarding-progress-bar" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="onboarding-step-count">{step + 1} / {STEPS.length}</div>

        {/* Step card */}
        <div className="onboarding-card">
          <div className="onboarding-emoji">{current.emoji}</div>
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-desc">{current.desc}</p>
        </div>

        {/* Last step notice */}
        {isLast && (
          <div className="onboarding-notice">
            <span>🔒</span>
            <p>Τα δεδομένα αποθηκεύονται <strong>μόνο στη συσκευή σου</strong> εκτός αν αποθηκεύσεις τη λίστα.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="onboarding-actions">
          <button className="onboarding-btn-primary" onClick={handleNext}>
            {isLast ? (isModal ? '✓ Κλείσιμο' : '🚀 Ξεκίνα!') : 'Επόμενο →'}
          </button>
          {!isLast && (
            <button className="onboarding-btn-skip" onClick={onDone}>
              Παράλειψη
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
