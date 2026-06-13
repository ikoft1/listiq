import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { searchByBarcode } from '../lib/api'
import './BarcodeScanner.css'

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [status, setStatus] = useState('Στρέψε την κάμερα στο barcode...')
  const [found, setFound] = useState(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
      if (result && !found) {
        setFound(true)
        setStatus('Βρέθηκε! Αναζήτηση...')
        const barcode = result.getText()
        const product = await searchByBarcode(barcode)
        onResult(product || { name: `Barcode: ${barcode}` })
      }
    })

    return () => {
      reader.reset()
    }
  }, [])

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <span className="scanner-title">Σκανάρισμα barcode</span>
          <button onClick={onClose} className="scanner-close">✕</button>
        </div>
        <div className="scanner-video-wrap">
          <video ref={videoRef} className="scanner-video" />
          <div className="scanner-frame" />
        </div>
        <p className="scanner-status">{status}</p>
      </div>
    </div>
  )
}
