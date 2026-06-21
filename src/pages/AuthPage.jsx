import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './AuthPage.css'

export default function AuthPage({ onGuest }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Λάθος email ή κωδικός')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Έλεγξε το email σου για επιβεβαίωση!')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">Listiq</h1>
        <p className="auth-sub">Έξυπνη λίστα αγορών</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Κωδικός"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Σύνδεση' : 'Εγγραφή'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' ? (
            <span>Δεν έχεις λογαριασμό; <button onClick={() => setMode('signup')}>Εγγραφή</button></span>
          ) : (
            <span>Έχεις λογαριασμό; <button onClick={() => setMode('login')}>Σύνδεση</button></span>
          )}
        </div>

        <div className="auth-divider"><span>ή</span></div>

        <button className="auth-google-btn" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Σύνδεση με Google
        </button>

        <button className="auth-guest-btn" onClick={onGuest}>
          👤 Συνέχεια χωρίς εγγραφή
        </button>

        <p className="auth-note">Τα δεδομένα αποθηκεύονται μόνο στη συσκευή σου</p>
      </div>
    </div>
  )
}
