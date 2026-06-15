import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './AuthPage.css'

export default function AuthPage() {
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">Listiq</h1>
        <p className="auth-sub">Έξυπνη λίστα αγορών</p>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Σύνδεση</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Εγγραφή</button>
        </div>

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

        <p className="auth-skip">
          <button onClick={() => {}}>Συνέχεια χωρίς λογαριασμό →</button>
        </p>
      </div>
    </div>
  )
}
