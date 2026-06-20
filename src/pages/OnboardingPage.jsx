import { useState } from 'react'
import './OnboardingPage.css'

const STEPS = [
  {
    emoji: '🛒',
    title: 'Φτιάξε τη λίστα σου',
    desc: 'Πρόσθεσε προϊόντα με αναζήτηση ή σκανάρισμα barcode. Οι τιμές έρχονται αυτόματα από το PosoKanei.',
  },
  {
    emoji: '📊',
    title: 'Βρες το καλύτερο SM',
    desc: 'Το Listiq συγκρίνει τιμές σε όλα τα σούπερ μάρκετ και σου λέει πού θα πληρώσεις λιγότερο για τη λίστα σου.',
  },
  {
    emoji: '🏪',
    title: 'Πήγαινε για ψώνια',
    desc: 'Επίλεξε SM και ξεκίνα. Τσεκάρισε προϊόντα καθώς τα βάζεις στο καλάθι. Πρόσθεσε τιμή ραφιού για ακριβές σύνολο.',
  },
  {
    emoji: '⭐',
    title: 'Αποθήκευσε αγαπημένα',
    desc: 'Μετά τα ψώνια αποθήκευσε τα προϊόντα σου. Την επόμενη φορά φόρτωσέ τα με ένα tap.',
  },
]

export default function OnboardingPage({ onDone, isModal }) {
  const [step, setStep] = useState(0)

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onDone()
    }
  }

  function handleSkip() {
    onDone()
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="onboarding">
      <div className="onboarding-inner">

        {/* Logo */}
        <div className="onboarding-logo">
          <span className="onboarding-logo-text">Listiq</span>
        </div>

        {/* Step card */}
        <div className="onboarding-card">
          <div className="onboarding-emoji">{current.emoji}</div>
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-desc">{current.desc}</p>
        </div>

        {/* Dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === step ? 'onboarding-dot--active' : ''}`}
            />
          ))}
        </div>

        {/* Local storage notice */}
        {isLast && (
          <div className="onboarding-notice">
            <span>🔒</span>
            <p>Τα δεδομένα σου αποθηκεύονται <strong>μόνο στη συσκευή σου</strong>. Αν διαγράψεις την εφαρμογή, χάνονται όλα.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="onboarding-actions">
          <button className="onboarding-btn-primary" onClick={handleNext}>
            {isLast ? (isModal ? '✓ Κλείσιμο' : '🚀 Ξεκίνα') : 'Επόμενο →'}
          </button>
          {!isLast && (
            <button className="onboarding-btn-skip" onClick={handleSkip}>
              Παράλειψη
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
