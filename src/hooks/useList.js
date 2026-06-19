import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'listiq_items'

export function useList() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })
  const [listId, setListId] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadFromSupabase()
  }, [user])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  async function loadFromSupabase() {
    let { data: lists } = await supabase
      .from('lists')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
    let id
    if (!lists?.length) {
      const { data } = await supabase
        .from('lists')
        .insert({ user_id: user.id, name: 'Λίστα μου' })
        .select('id')
        .single()
      id = data?.id
    } else {
      id = lists[0].id
    }
    setListId(id)
    const { data: dbItems } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', id)
      .order('created_at', { ascending: false })
    if (dbItems?.length) {
      setItems(dbItems.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        checked: i.checked,
        price: i.price,
        store: i.store,
        barcode: i.barcode,
        product_id: i.product_id || null,
        retailer_prices: i.retailer_prices || [],
      })))
    }
  }

 async function addItem(product) {
  console.log('addItem retailer_prices', product.retailer_prices)
  const item = {
      id: crypto.randomUUID(),
      name: product.name || product,
      quantity: 1,
      checked: false,
      price: product.price || null,
      store: product.store || null,
      barcode: product.barcode || null,
      product_id: product.id || null,
      retailer_prices: product.retailer_prices || [],
    }
    setItems(prev => [item, ...prev])
    if (user && listId) {
      await supabase.from('list_items').insert({
        id: item.id,
        list_id: listId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        store: item.store,
        barcode: item.barcode,
        checked: false,
      })
    }
    return item
  }

  async function toggleItem(id) {
    const item = items.find(i => i.id === id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
    if (user) {
      await supabase.from('list_items').update({ checked: !item.checked }).eq('id', id)
    }
  }

  async function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (user) {
      await supabase.from('list_items').delete().eq('id', id)
    }
  }

  async function updateItem(id, updates) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
    if (user) {
      await supabase.from('list_items').update(updates).eq('id', id)
    }
  }

  async function clearChecked() {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    setItems(prev => prev.filter(i => !i.checked))
    if (user && checkedIds.length) {
      await supabase.from('list_items').delete().in('id', checkedIds)
    }
  }

  function clearAll() {
    setItems([])
    if (user && listId) {
      supabase.from('list_items').delete().eq('list_id', listId)
    }
  }

  const total = items
    .filter(i => i.checked && i.price)
    .reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0)

  const checkedCount = items.filter(i => i.checked).length

  return { items, addItem, toggleItem, removeItem, updateItem, clearChecked, clearAll, total, checkedCount, user }
}
