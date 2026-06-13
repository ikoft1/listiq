import { useState, useEffect } from 'react'

const STORAGE_KEY = 'listiq_items'

export function useList() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product) {
    const item = {
      id: Date.now(),
      name: product.name || product,
      quantity: 1,
      checked: false,
      price: product.price || null,
      store: product.store || null,
      productId: product.id || null,
    }
    setItems(prev => [item, ...prev])
    return item
  }

  function toggleItem(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(id, updates) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function clearChecked() {
    setItems(prev => prev.filter(i => !i.checked))
  }

  function clearAll() {
    setItems([])
  }

  const total = items
    .filter(i => i.checked && i.price)
    .reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0)

  const checkedCount = items.filter(i => i.checked).length

  return { items, addItem, toggleItem, removeItem, updateItem, clearChecked, clearAll, total, checkedCount }
}
