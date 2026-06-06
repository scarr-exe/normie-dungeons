'use client'

import { useState } from 'react'
import { useNormie } from '@/hooks/useNormie'
import { useWalletNormies } from '@/hooks/useWalletNormies'
import { CharacterSheet } from './CharacterSheet'
import { NormieCharacter } from '@/types/normie'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'

const C = {
  bg: '#0d0d0f', panel: '#13131a', panelMid: '#1a1a24',
  border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25',
  text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', red: '#dc2626',
}

export function NormieSelector({ onSelect }: { onSelect: (normie: NormieCharacter) => void }) {
  const [tab, setTab] = useState<'id' | 'wallet'>('id')
  const [input, setInput] = useState('')
  const { normie, loading, error, fetchNormie } = useNormie()
  const { normieIds, loading: walletLoading } = useWalletNormies()
  const { isConnected } = useAccount()

  return (
    <div style={{ width: '100%', maxWidth: '480px', fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1px', background: C.border, marginBottom: '20px' }}>
        {[
          { id: 'id', label: 'ENTER ID' },
          { id: 'wallet', label: isConnected ? 'MY NORMIES' : 'MY NORMIES (CONNECT WALLET)' },
        ].map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id as 'id' | 'wallet')}
            disabled={t.id === 'wallet' && !isConnected}
            style={{
              flex: 1, padding: '10px', background: tab === t.id ? C.panelMid : C.panel,
              border: 'none', color: tab === t.id ? C.gold : C.textMuted,
              cursor: t.id === 'wallet' && !isConnected ? 'not-allowed' : 'pointer',
              fontSize: '10px', letterSpacing: '0.15em', fontFamily: "'IBM Plex Mono', monospace",
              borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Enter ID tab */}
      {tab === 'id' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="number" placeholder="Normie ID (e.g. 42)"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchNormie(input)}
              min="1" max="10000"
              style={{ flex: 1, background: C.panelMid, border: `1px solid ${C.border}`, color: C.text, padding: '12px 14px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
            />
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => fetchNormie(input)} disabled={!input || loading}
              style={{ background: !input || loading ? C.panelMid : C.gold, border: 'none', color: !input || loading ? C.textMuted : '#0d0d0f', padding: '12px 20px', cursor: !input || loading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
              {loading ? '...' : 'SEARCH'}
            </motion.button>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: C.red, fontSize: '11px', marginBottom: '12px', letterSpacing: '0.05em' }}>{error}</motion.p>
          )}

          {normie && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CharacterSheet normie={normie} onConfirm={() => onSelect(normie)} />
            </motion.div>
          )}
        </div>
      )}

      {/* Wallet tab */}
      {tab === 'wallet' && (
        <div>
          {walletLoading && (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ color: C.textDim, fontSize: '11px', letterSpacing: '0.1em', textAlign: 'center', padding: '24px' }}>
              LOADING YOUR NORMIES...
            </motion.p>
          )}
          {!walletLoading && normieIds.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', border: `1px dashed ${C.border}` }}>
              <p style={{ color: C.textMuted, fontSize: '11px', letterSpacing: '0.1em' }}>NO NORMIES FOUND IN THIS WALLET</p>
            </div>
          )}
          {!walletLoading && normieIds.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {normieIds.map(id => (
                <motion.button key={id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setTab('id'); setInput(id); fetchNormie(id) }}
                  style={{ background: C.panelMid, border: `1px solid ${C.border}`, color: C.textDim, padding: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                  #{id}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}