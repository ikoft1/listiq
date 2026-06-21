import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'listiq_items'
const ACTIVE_LIST_KEY = 'listiq_active_list'
const GUEST_ITEMS_KEY = 'listiq_guest_items'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useList() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })
  const [listId, setListId] = useState(() => localStorage.getItem(ACTIVE_LIST_KEY) || null)
  const [listName, setListName] = useState('Λίστα μου')
  const [inviteCode, setInviteCode] = useState(null)
  const [user, setUser] = useState(null)
  const [lists, setLists] = useState([])
  const realtimeRef = useRef(null)

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
    if (user) {
      // Αποθήκευσε τα guest items πριν κάνουμε τίποτα
      const currentItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').filter(i => i.name)
      if (currentItems.length > 0) {
        localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(currentItems))
      }
      loadUserLists()
    } else {
      setItems(JSON.parse(localStorage.getItem(STORAGE_KEY)) || [])
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, user])

  // Real-time subscription
  useEffect(() => {
    if (!listId || !user) return
    if (realtimeRef.current) realtimeRef.current.unsubscribe()

    const channel = supabase
      .channel(`list_items_${listId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'list_items',
        filter: `list_id=eq.${listId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => {
            if (prev.find(i => i.id === payload.new.id)) return prev
            return [mapDbItem(payload.new), ...prev]
          })
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i =>
            i.id === payload.new.id ? { ...i, ...mapDbItem(payload.new) } : i
          ))
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== payload.old.id))
        }
      })
      .subscribe()

    realtimeRef.current = channel
    return () => channel.unsubscribe()
  }, [listId, user])

  function mapDbItem(i) {
    return {
      id: i.id,
      name: i.name,
      brand: i.brand || null,
      quantity: i.quantity || 1,
      checked: i.checked,
      price: i.price,
      store: i.store,
      barcode: i.barcode,
      product_id: i.product_id || null,
      retailer_prices: i.retailer_prices || [],
      unit: i.unit || null,
      unit_quantity: i.unit_quantity || null,
      category_ids: i.category_ids || [],
    }
  }

  async function loadUserLists() {
    const { data: ownLists } = await supabase
      .from('lists')
      .select('id, name, invite_code, user_id')
      .eq('user_id', user.id)

    const { data: memberLists } = await supabase
      .from('list_members')
      .select('list_id, lists(id, name, invite_code, user_id)')
      .eq('user_id', user.id)

    const allLists = [
      ...(ownLists || []),
      ...(memberLists || []).map(m => m.lists).filter(Boolean)
    ]

    setLists(allLists)

    const savedListId = localStorage.getItem(ACTIVE_LIST_KEY)
    const activeList = allLists.find(l => l.id === savedListId) || allLists[0]

    let targetListId
    if (activeList) {
      targetListId = activeList.id
    } else {
      const newList = await createListInternal('Λίστα μου')
      targetListId = newList?.id
    }

    if (targetListId) {
      // Πρώτα κάνε migration των guest items
      const guestItems = JSON.parse(localStorage.getItem(GUEST_ITEMS_KEY) || '[]').filter(i => i.name)
      
      if (guestItems.length > 0) {
        // Ανέβασε τα guest items στο Supabase
        for (const item of guestItems) {
          await supabase.from('list_items').insert({
            id: crypto.randomUUID(),
            list_id: targetListId,
            name: item.name,
            brand: item.brand || null,
            quantity: item.quantity || 1,
            price: item.price || null,
            store: item.store || null,
            barcode: item.barcode || null,
            product_id: item.product_id || null,
            unit: item.unit || null,
            unit_quantity: item.unit_quantity || null,
            checked: item.checked || false,
          })
        }
        localStorage.removeItem(GUEST_ITEMS_KEY)
      }

      // Μετά φόρτωσε τα items από Supabase
      await switchToList(targetListId)
    }
  }

  // Internal version για χρήση εντός του hook
  async function createListInternal(name) {
    const code = generateInviteCode()
    const { data } = await supabase
      .from('lists')
      .insert({ user_id: user.id, name, invite_code: code })
      .select('id, name, invite_code')
      .single()
    if (data) setLists(prev => [...prev, data])
    return data
  }

  async function createList(name) {
    const data = await createListInternal(name)
    if (data) await switchToList(data.id)
    return data
  }

  async function switchToList(id) {
    setListId(id)
    localStorage.setItem(ACTIVE_LIST_KEY, id)

    const { data: listData } = await supabase
      .from('lists')
      .select('name, invite_code')
      .eq('id', id)
      .single()

    if (listData) {
      setListName(listData.name)
      setInviteCode(listData.invite_code)
    }

    const { data: dbItems } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', id)
      .order('created_at', { ascending: false })

    setItems(dbItems ? dbItems.map(mapDbItem) : [])
  }

  async function joinList(code) {
    const { data: list } = await supabase
      .from('lists')
      .select('id, name, invite_code, user_id')
      .eq('invite_code', code.toUpperCase())
      .single()

    if (!list) return { error: 'Δεν βρέθηκε λίστα με αυτόν τον κωδικό' }
    if (list.user_id === user.id) return { error: 'Αυτή είναι η δική σου λίστα' }

    await supabase.from('list_members').upsert({ list_id: list.id, user_id: user.id })
    setLists(prev => [...prev.filter(l => l.id !== list.id), list])
    await switchToList(list.id)
    return { success: true, list }
  }

  async function renameList(id, name) {
    await supabase.from('lists').update({ name }).eq('id', id)
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l))
    if (id === listId) setListName(name)
  }

  async function deleteList(id) {
    await supabase.from('lists').delete().eq('id', id)
    setLists(prev => prev.filter(l => l.id !== id))
    if (id === listId) {
      const remaining = lists.filter(l => l.id !== id)
      if (remaining.length > 0) {
        await switchToList(remaining[0].id)
      } else {
        await createList('Λίστα μου')
      }
    }
  }

  async function addItem(product) {
    const item = {
      id: crypto.randomUUID(),
      name: product.name || product,
      brand: product.brand || null,
      quantity: product.quantity || 1,
      checked: false,
      price: product.price || null,
      store: product.store || null,
      barcode: product.barcode || null,
      product_id: product.id || null,
      retailer_prices: product.retailer_prices || [],
      unit: product.unit || null,
      unit_quantity: product.unit_quantity || null,
      category_ids: product.category_ids || [],
    }
    setItems(prev => [item, ...prev])
    if (user && listId) {
      await supabase.from('list_items').insert({
        id: item.id,
        list_id: listId,
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        price: item.price,
        store: item.store,
        barcode: item.barcode,
        product_id: item.product_id,
        unit: item.unit,
        unit_quantity: item.unit_quantity,
        checked: false,
      })
    }
    return item
  }

  async function toggleItem(id) {
    const item = items.find(i => i.id === id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
    if (user) await supabase.from('list_items').update({ checked: !item.checked }).eq('id', id)
  }

  async function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (user) await supabase.from('list_items').delete().eq('id', id)
  }

  async function updateItem(id, updates) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
    if (user) await supabase.from('list_items').update(updates).eq('id', id)
  }

  async function clearChecked() {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    setItems(prev => prev.filter(i => !i.checked))
    if (user && checkedIds.length) await supabase.from('list_items').delete().in('id', checkedIds)
  }

  async function clearAll() {
    setItems([])
    if (user && listId) await supabase.from('list_items').delete().eq('list_id', listId)
  }

  const total = items
    .filter(i => i.checked && i.price)
    .reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0)

  const checkedCount = items.filter(i => i.checked).length

  return {
    items, addItem, toggleItem, removeItem, updateItem, clearChecked, clearAll,
    total, checkedCount, user,
    lists, listId, listName, inviteCode,
    createList, switchToList, joinList, renameList, deleteList,
  }
}
