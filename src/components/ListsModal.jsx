import AuthPage from '../pages/AuthPage'
import { useState } from 'react'
import './ListsModal.css'

export default function ListsModal({
  lists, listId, listName, inviteCode, user,
  onSwitch, onCreate, onJoin, onRename, onDelete, onClose
}) {
  const [view, setView] = useState('main') // main | new | join | invite | rename
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [renameId, setRenameId] = useState(null)
  const [renameName, setRenameName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading(true)
    await onCreate(newName.trim())
    setLoading(false)
    onClose()
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setLoading(true)
    setError(null)
    const result = await onJoin(joinCode.trim())
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  async function handleRename() {
    if (!renameName.trim()) return
    setLoading(true)
    await onRename(renameId, renameName.trim())
    setLoading(false)
    setView('main')
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShare() {
    const text = `Γεια! Σε προσκαλώ στη λίστα αγορών μου "${listName}" στο Listiq.\n\nΚωδικός: ${inviteCode}\n\ngolistiq.com`
    if (navigator.share) {
      navigator.share({ title: 'Πρόσκληση Listiq', text })
    } else {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Αν δεν είναι logged in → εμφάνισε login
  if (!user) {
    return (
      <div className="lists-overlay" onClick={onClose}>
        <div className="lists-modal lists-modal--auth" onClick={e => e.stopPropagation()}>
          <div className="lists-header">
            <h2 className="lists-title">Σύνδεση απαιτείται</h2>
            <button className="lists-close" onClick={onClose}>✕</button>
          </div>
          <p className="lists-auth-desc">Συνδέσου για να αποθηκεύσεις και να κοινοποιήσεις τη λίστα σου.</p>
          <AuthPage onGuest={onClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="lists-overlay" onClick={onClose}>
      <div className="lists-modal" onClick={e => e.stopPropagation()}>

        {/* ── Main view ── */}
        {view === 'main' && (
          <>
            <div className="lists-header">
              <h2 className="lists-title">Οι λίστες μου</h2>
              <button className="lists-close" onClick={onClose}>✕</button>
            </div>

            <div className="lists-list">
              {lists.map(l => (
                <div key={l.id} className={`lists-item ${l.id === listId ? 'lists-item--active' : ''}`}>
                  <button className="lists-item-main" onClick={() => { onSwitch(l.id); onClose() }}>
                    <span className="lists-item-check">{l.id === listId ? '✓' : ''}</span>
                    <span className="lists-item-name">{l.name}</span>
                    {l.user_id !== user?.id && <span className="lists-item-shared">κοινή</span>}
                  </button>
                  <div className="lists-item-actions">
                    <button onClick={() => { setRenameId(l.id); setRenameName(l.name); setView('rename') }}>✏️</button>
                    {lists.length > 1 && l.user_id === user?.id && (
                      <button onClick={() => onDelete(l.id)}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="lists-actions">
              <button className="lists-action-btn" onClick={() => setView('new')}>
                + Νέα λίστα
              </button>
              <button className="lists-action-btn" onClick={() => setView('invite')}>
                🔗 Κοινοποίηση κωδικού
              </button>
              <button className="lists-action-btn" onClick={() => setView('join')}>
                📥 Συμμετοχή σε λίστα
              </button>
            </div>
          </>
        )}

        {/* ── New list ── */}
        {view === 'new' && (
          <>
            <div className="lists-header">
              <button className="lists-back" onClick={() => setView('main')}>←</button>
              <h2 className="lists-title">Νέα λίστα</h2>
              <button className="lists-close" onClick={onClose}>✕</button>
            </div>
            <div className="lists-form">
              <input
                className="lists-input"
                placeholder="Όνομα λίστας..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
              <button className="lists-submit-btn" onClick={handleCreate} disabled={loading || !newName.trim()}>
                {loading ? '...' : 'Δημιουργία'}
              </button>
            </div>
          </>
        )}

        {/* ── Invite code ── */}
        {view === 'invite' && (
          <>
            <div className="lists-header">
              <button className="lists-back" onClick={() => setView('main')}>←</button>
              <h2 className="lists-title">Κοινοποίηση</h2>
              <button className="lists-close" onClick={onClose}>✕</button>
            </div>
            <div className="lists-invite">
              <p className="lists-invite-desc">Στείλε αυτόν τον κωδικό για να δει κάποιος την λίστα <strong>"{listName}"</strong>:</p>
              <div className="lists-invite-code">{inviteCode}</div>
              <button className="lists-submit-btn" onClick={handleShare}>
                📤 Κοινοποίηση
              </button>
              <button className="lists-action-btn" onClick={handleCopyCode}>
                {copied ? '✅ Αντιγράφηκε!' : '📋 Αντιγραφή κωδικού'}
              </button>
            </div>
          </>
        )}

        {/* ── Join list ── */}
        {view === 'join' && (
          <>
            <div className="lists-header">
              <button className="lists-back" onClick={() => setView('main')}>←</button>
              <h2 className="lists-title">Συμμετοχή</h2>
              <button className="lists-close" onClick={onClose}>✕</button>
            </div>
            <div className="lists-form">
              <p className="lists-invite-desc">Βάλε τον κωδικό που σου έστειλαν:</p>
              <input
                className="lists-input lists-input--code"
                placeholder="ABC123"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
              />
              {error && <p className="lists-error">{error}</p>}
              <button className="lists-submit-btn" onClick={handleJoin} disabled={loading || !joinCode.trim()}>
                {loading ? '...' : 'Συμμετοχή'}
              </button>
            </div>
          </>
        )}

        {/* ── Rename ── */}
        {view === 'rename' && (
          <>
            <div className="lists-header">
              <button className="lists-back" onClick={() => setView('main')}>←</button>
              <h2 className="lists-title">Μετονομασία</h2>
              <button className="lists-close" onClick={onClose}>✕</button>
            </div>
            <div className="lists-form">
              <input
                className="lists-input"
                value={renameName}
                onChange={e => setRenameName(e.target.value)}
                autoFocus
              />
              <button className="lists-submit-btn" onClick={handleRename} disabled={loading || !renameName.trim()}>
                {loading ? '...' : 'Αποθήκευση'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
