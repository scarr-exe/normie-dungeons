'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { NormieSelector } from '@/components/game/NormieSelector'
import { CharacterSheet } from '@/components/game/CharacterSheet'
import { createSession, joinSession, addPlayerToSession, getSessionPlayers } from '@/lib/sessions'
import { NormieCharacter } from '@/types/normie'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const C = {
  bg: '#0d0d0f', panel: '#13131a', panelMid: '#1a1a24',
  border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25',
  text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840',
  red: '#dc2626',
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
      <span style={{ fontSize: '10px', color: C.gold, letterSpacing: '0.25em', fontFamily: 'Cinzel, serif', whiteSpace: 'nowrap' }}>
        ◆ {title} ◆
      </span>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
    </div>
  )
}

type LobbyStep = 'choose_mode' | 'select_normie' | 'join_code'

const MODES = [
  {
    id: 'solo',
    icon: '⚔',
    title: 'SOLO ADVENTURE',
    subtitle: 'Face the dungeon alone',
    desc: 'One adventurer. One dungeon. Your choices shape the story.',
  },
  {
    id: 'party',
    icon: '⚔⚔',
    title: 'CREATE PARTY',
    subtitle: 'Host a dungeon for allies',
    desc: 'Gather up to 4 adventurers and conquer the dungeon together.',
  },
  {
    id: 'join',
    icon: '🗝',
    title: 'JOIN PARTY',
    subtitle: 'Enter an invite code',
    desc: 'A fellow adventurer awaits. Enter their session code to join.',
  },
]

export default function LobbyPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [step, setStep] = useState<LobbyStep>('choose_mode')
  const [selectedNormie, setSelectedNormie] = useState<NormieCharacter | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeConfirmed, setJoinCodeConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingMode, setPendingMode] = useState<'solo' | 'party'>('solo')
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && !user) router.push('/')
  }, [userLoading, user])

  async function handleStartGame() {
    if (!user || !selectedNormie) return
    setLoading(true)
    setError('')
    const session = await createSession(user.id, pendingMode)
    if (!session) { setError('Failed to create session.'); setLoading(false); return }
    const added = await addPlayerToSession(session.id, user.id, selectedNormie.id, selectedNormie.characterClass, selectedNormie.stats as unknown as Record<string, number>, selectedNormie.maxHp, 1)
    if (!added) { setError('Failed to enter dungeon.'); setLoading(false); return }
    if (pendingMode === 'party') router.push(`/party/${session.id}`)
    else router.push(`/game/${session.id}`)
  }

  async function handleJoinSession() {
    if (!user || !selectedNormie || !joinCode) return
    setLoading(true)
    setError('')
    const session = await joinSession(joinCode)
    if (!session) { setError('Session not found. Check the code and try again.'); setLoading(false); return }
    const players = await getSessionPlayers(session.id)
    const alreadyIn = players.find((p: { user_id: string }) => p.user_id === user.id)
    if (alreadyIn) { router.push(`/party/${session.id}`); return }
    const turnOrder = players.length + 1
    if (turnOrder > 4) { setError('This party is full.'); setLoading(false); return }
    const added = await addPlayerToSession(session.id, user.id, selectedNormie.id, selectedNormie.characterClass, selectedNormie.stats as unknown as Record<string, number>, selectedNormie.maxHp, turnOrder)
    if (!added) { setError('Failed to join.'); setLoading(false); return }
    router.push(`/party/${session.id}`)
  }

  if (userLoading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: C.textMuted, fontFamily: 'Cinzel, serif', letterSpacing: '0.2em' }}>LOADING...</p></div>
  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.panel }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', color: C.gold, letterSpacing: '0.1em' }}>⚔ NORMIE DUNGEONS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: C.textDim }}>{user.username}</span>
          {user.badge === 'verified' && <span style={{ fontSize: '9px', color: C.gold, border: `1px solid ${C.goldDim}`, padding: '2px 6px', letterSpacing: '0.1em' }}>VERIFIED HOLDER</span>}
        </div>
      </motion.div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
        <AnimatePresence mode="wait">

          {/* Mode selection */}
          {step === 'choose_mode' && (
            <motion.div key="mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <p style={{ fontSize: '10px', color: C.gold, letterSpacing: '0.3em', marginBottom: '12px' }}>ADVENTURERS GUILD</p>
                <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: C.text, margin: '0 0 8px', letterSpacing: '0.05em' }}>CHOOSE YOUR PATH</h1>
                <p style={{ fontSize: '12px', color: C.textDim, margin: 0 }}>What manner of adventure do you seek, {user.username}?</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MODES.map((mode, i) => (
                  <motion.button key={mode.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onHoverStart={() => setHoveredMode(mode.id)}
                    onHoverEnd={() => setHoveredMode(null)}
                    onClick={() => {
                      if (mode.id === 'join') { setPendingMode('party'); setStep('join_code') }
                      else { setPendingMode(mode.id as 'solo' | 'party'); setStep('select_normie') }
                    }}
                    style={{
                      background: hoveredMode === mode.id ? C.panelMid : C.panel,
                      border: `1px solid ${hoveredMode === mode.id ? C.gold : C.border}`,
                      padding: '20px 24px', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '20px',
                      transition: 'all 0.2s', fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                    <span style={{ fontSize: '24px', width: '40px', textAlign: 'center' }}>{mode.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', color: hoveredMode === mode.id ? C.gold : C.text, margin: '0 0 4px', letterSpacing: '0.1em' }}>{mode.title}</p>
                      <p style={{ fontSize: '10px', color: C.textDim, margin: '0 0 4px', letterSpacing: '0.1em' }}>{mode.subtitle}</p>
                      <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>{mode.desc}</p>
                    </div>
                    <span style={{ color: hoveredMode === mode.id ? C.gold : C.border, fontSize: '18px' }}>›</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Normie selection (solo/party) */}
          {step === 'select_normie' && (
            <motion.div key="normie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <button onClick={() => { setStep('choose_mode'); setSelectedNormie(null) }}
                style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'IBM Plex Mono', monospace" }}>
                ← BACK TO GUILD
              </button>

              {!selectedNormie ? (
                <>
                  <SectionDivider title="CHOOSE YOUR CHAMPION" />
                  <NormieSelector onSelect={setSelectedNormie} />
                </>
              ) : (
                <>
                  <SectionDivider title="CONFIRM YOUR CHAMPION" />
                  <CharacterSheet normie={selectedNormie} />
                  {error && <p style={{ color: C.red, fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>{error}</p>}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => setSelectedNormie(null)}
                      style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, color: C.textDim, padding: '12px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
                      CHOOSE DIFFERENT
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleStartGame} disabled={loading}
                      style={{ flex: 2, background: loading ? C.panelMid : C.gold, border: 'none', color: '#0d0d0f', padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
                      {loading ? 'ENTERING...' : 'ENTER DUNGEON →'}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Join flow */}
          {step === 'join_code' && (
            <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <button onClick={() => { setStep('choose_mode'); setJoinCodeConfirmed(false); setSelectedNormie(null) }}
                style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'IBM Plex Mono', monospace" }}>
                ← BACK TO GUILD
              </button>

              {!joinCodeConfirmed ? (
                <>
                  <SectionDivider title="ENTER SESSION CODE" />
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <p style={{ fontSize: '12px', color: C.textDim }}>A fellow adventurer awaits. Enter their session code to join their dungeon.</p>
                  </div>
                  <input type="text" placeholder="NRM-XXX" value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={7}
                    style={{ width: '100%', background: C.panelMid, border: `1px solid ${C.border}`, color: C.text, padding: '16px', fontSize: '24px', fontFamily: 'Cinzel, serif', letterSpacing: '0.3em', textAlign: 'center', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }} />
                  <motion.button whileTap={{ scale: 0.98 }}
                    onClick={() => setJoinCodeConfirmed(true)} disabled={joinCode.length < 7}
                    style={{ width: '100%', background: joinCode.length < 7 ? C.panelMid : C.gold, border: 'none', color: '#0d0d0f', padding: '14px', cursor: joinCode.length < 7 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>
                    FIND SESSION →
                  </motion.button>
                </>
              ) : !selectedNormie ? (
                <>
                  <SectionDivider title="CHOOSE YOUR CHAMPION" />
                  <div style={{ textAlign: 'center', marginBottom: '16px', padding: '8px', border: `1px solid ${C.goldDim}`, background: '#1a1508' }}>
                    <span style={{ fontSize: '10px', color: C.gold }}>JOINING SESSION </span>
                    <span style={{ fontSize: '12px', color: C.text, fontFamily: 'Cinzel, serif', letterSpacing: '0.2em' }}>{joinCode}</span>
                  </div>
                  <NormieSelector onSelect={setSelectedNormie} />
                </>
              ) : (
                <>
                  <SectionDivider title="CONFIRM YOUR CHAMPION" />
                  <div style={{ textAlign: 'center', marginBottom: '16px', padding: '8px', border: `1px solid ${C.goldDim}`, background: '#1a1508' }}>
                    <span style={{ fontSize: '10px', color: C.gold }}>JOINING SESSION </span>
                    <span style={{ fontSize: '12px', color: C.text, fontFamily: 'Cinzel, serif', letterSpacing: '0.2em' }}>{joinCode}</span>
                  </div>
                  <CharacterSheet normie={selectedNormie} />
                  {error && <p style={{ color: C.red, fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>{error}</p>}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => setSelectedNormie(null)}
                      style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, color: C.textDim, padding: '12px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
                      CHOOSE DIFFERENT
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleJoinSession} disabled={loading}
                      style={{ flex: 2, background: loading ? C.panelMid : C.gold, border: 'none', color: '#0d0d0f', padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
                      {loading ? 'JOINING...' : 'JOIN DUNGEON →'}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}