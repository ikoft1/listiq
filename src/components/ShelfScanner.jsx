import { useRef, useState, useCallback } from 'react'
import { scanShelfLabel } from '../lib/ocr'
import './ShelfScanner.css'

const STATES = {
  CAMERA: 'camera',
  PROCESSING: 'processing',
  CONFIRM: 'confirm',
}

export default function ShelfScanner({ onResult, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState(STATES.CAMERA)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState(null)

  const startCamera = useCallback(async (node) => {
    if (!node) return
    videoRef.current = node
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      node.srcObject = stream
    } catch {
      setError('Δεν βρέθηκε κάμερα')
    }
  }, [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function capture() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const imageSrc = canvas.toDataURL('image/jpeg', 0.9)

    stopCamera()
    setState(STATES.PROCESSING)
    setProgress(0)

    try {
      const parsed = await scanShelfLabel(imageSrc, setProgress)
      setResult(parsed)
      setName(parsed.name || '')
      setPrice(parsed.price ? String(parsed.price) : '')
      setState(STATES.CONFIRM)
    } catch {
      setError('Σφάλμα ανάγνωσης. Δοκίμασε ξανά.')
      setState(STATES.CAMERA)
    }
  }

  function confirm() {
    if (!name.trim()) return
    onResult({
      name: name.trim(),
      price: price ? parseFloat(price) : null,
    })
  }

  function retry() {
    setResult(null)
    setName('')
    setPrice('')
    setError(null)
    setState(STATES.CAMERA)
  }

  return (
    <div className="shelf-overlay">
      <div className="shelf-container">

        <div className="shelf-header">
          <span className="shelf-title">
            {state === STATES.CAMERA && 'Σκανάρισμα ετικέτας'}
            {state === STATES.PROCESSING && 'Ανάγνωση...'}
            {state === STATES.CONFIRM && 'Επιβεβαίωση'}
          </span>
          <button onClick={() => { stopCamera(); onClose() }} className="shelf-close">✕</button>
        </div>

        {state === STATES.CAMERA && (
          <>
            <div className="shelf-video-wrap">
              <video ref={startCamera} autoPlay playsInline muted className="shelf-video" />
              <div className="shelf-guide">
                <div className="guide-box" />
                <p className="guide-text">Στρέψε στην ετικέτα του ραφιού</p>
              </div>
            </div>
            {error && <p className="shelf-error">{error}</p>}
            <div className="shelf-actions">
              <button onClick={capture} className="btn-capture">
                <span className="capture-circle" />
              </button>
            </div>
          </>
        )}

        {state === STATES.PROCESSING && (
          <div className="processing-state">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="processing-text">Διαβάζω την ετικέτα... {progress}%</p>
          </div>
        )}

        {state === STATES.CONFIRM && (
          <div className="confirm-state">
            <p className="confirm-hint">Έλεγξε και διόρθωσε αν χρειαστεί</p>

            <div className="field">
              <label className="field-label">Προϊόν</label>
              <input
                className="field-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Όνομα προϊόντος"
                autoFocus
              />
            </div>

            <div className="field">
              <label className="field-label">Τιμή (€)</label>
              <input
                className="field-input"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="π.χ. 1.99"
                type="number"
                step="0.01"
                min="0"
              />
            </div>

            {result?.rawText && (
              <details className="raw-text">
                <summary>Τι διάβασε η κάμερα</summary>
                <pre>{result.rawText}</pre>
              </details>
            )}

            <div className="confirm-btns">
              <button onClick={retry} className="btn-retry">Ξανά</button>
              <button onClick={confirm} className="btn-confirm" disabled={!name.trim()}>
                Προσθήκη στη λίστα
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
