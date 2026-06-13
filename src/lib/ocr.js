import { createWorker } from 'tesseract.js'

let worker = null

async function getWorker() {
  if (!worker) {
    worker = await createWorker(['ell', 'eng'])
  }
  return worker
}

function preprocessCanvas(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3
        const val = avg > 140 ? 255 : 0
        data[i] = data[i+1] = data[i+2] = val
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageSrc
  })
}

function parseShelfLabel(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const priceRegex = /(\d{1,3})[.,](\d{2})/
  let price = null
  let priceStr = null

  for (const line of lines) {
    const match = line.match(priceRegex)
    if (match) {
      price = parseFloat(`${match[1]}.${match[2]}`)
      priceStr = `${match[1]}.${match[2]}`
      break
    }
  }

  const nameLine = lines.find(l => {
    const hasLetters = /[a-zA-Zα-ωΑ-Ω]/.test(l)
    const notPrice = !l.match(/^\d{1,3}[.,]\d{2}$/)
    const longEnough = l.length > 3
    return hasLetters && notPrice && longEnough
  })

  return {
    name: nameLine || null,
    price: price || null,
    rawText: text
  }
}

export async function scanShelfLabel(imageSrc, onProgress) {
  const processed = await preprocessCanvas(imageSrc)
  const w = await getWorker()

  const { data } = await w.recognize(processed, {}, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })

  return parseShelfLabel(data.text)
}

export async function terminateWorker() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
