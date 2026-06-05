'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

const C = {
  bg: '#0d0d0f', panel: '#13131a', panelMid: '#1a1a24',
  border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25',
  text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', red: '#dc2626',
}

export function UsernameModal({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createUser } = useUser()

  async function handleSubmit() {
    const trimmed = username.trim()
    if (trimmed.length < 3) { setError('Name must be at least 3 characters'); return }
    if (trimmed.length > 20) { setError('Name must be 20 characters or less'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setError('Letters, numbers, and underscores only'); return }

    setLoading(true)
    setError('')

    const { data: existing } = await supabase.from('users').select('id').eq('username', trimmed).single()
    if (existing) { setError('Name already taken'); setLoading(false); return }

    const user = await createUser(trimmed)
    if (!user) { setError('Something went wrong. Try again.'); setLoading(false); return }
    onComplete()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ background: C.panel, border: `1px solid ${C.goldDim}`, width: '100%', maxWidth: '420px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#1a1508', borderBottom: `1px solid ${C.goldDim}`, padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 8px' }}>⚔</p>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: C.gold, margin: '0 0 4px', letterSpacing: '0.1em' }}>ENTER THE DUNGEON</h2>
          <p style={{ fontSize: '10px', color: C.textDim, margin: 0, letterSpacing: '0.15em' }}>NORMIE DUNGEONS — ADVENTURERS GUILD</p>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '20px', lineHeight: 1.6, textAlign: 'center' }}>
            Choose your name, adventurer. Connect your wallet to verify Normie ownership and earn a holder badge.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <ConnectButton />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
            <span style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em' }}>YOUR NAME</span>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
          </div>

          <input type="text" placeholder="Enter your adventurer name..."
            value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            maxLength={20}
            style={{ width: '100%', background: C.panelMid, border: `1px solid ${error ? C.red : C.border}`, color: C.text, padding: '12px 14px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }} />

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: C.red, fontSize: '11px', marginBottom: '12px' }}>{error}</motion.p>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSubmit} disabled={loading || !username.trim()}
            style={{ width: '100%', background: loading || !username.trim() ? C.panelMid : C.gold, border: 'none', color: loading || !username.trim() ? C.textMuted : '#0d0d0f', padding: '14px', cursor: loading || !username.trim() ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>
            {loading ? 'PREPARING YOUR QUEST...' : 'BEGIN ADVENTURE →'}
          </motion.button>

          <p style={{ fontSize: '10px', color: C.textMuted, textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
            Wallet connection is optional. Normie holders receive a verified badge.
          </p>
        </div>
      </motion.div>
    </div>
  )
}