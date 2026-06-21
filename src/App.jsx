import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './index.css'
import ListPage from './pages/ListPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

async function handleSignOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('listiq_active_list')
  window.location.reload()
}

  if (loading) return null

  // Πάντα πηγαίνει στη ListPage — login εμφανίζεται μόνο όταν χρειάζεται
  return <ListPage onSignOut={handleSignOut} user={user} />
}
