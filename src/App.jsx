import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './index.css'
import ListPage from './pages/ListPage'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guest, setGuest] = useState(false)
 
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

  if (loading) return null
 // if (!user && !guest) return <AuthPage onGuest={() => setGuest(true)} />
  return <ListPage />
}
