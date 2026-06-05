'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { getSessionPlayers } from '@/lib/sessions'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const C = {
  bg: '#0d0d0f', panel: '#13131a', panelMid: '#1a1a24',
  border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25',
  text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', red: '#dc2626',
}

const CLASS_COLORS: Record<string, string> = {
  Warrior: '#ef4444', Rogue: '#eab308', Mage: '#3b82f6',
  Ranger: '#22c55e', Bard: '#a855f7', Adventurer: '#9ca3af',
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
      <span style={{ fontSize: '10px', color: C.gold, letterSpacing: '0.25em', fontFamily: 'Cinzel, serif' }}>◆ {title} ◆</span>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
    </div>
  )
}

interface WaitingPlayer {
  id: string; userId: string; username: string; badge: string
  normieId: string; characterClass: string; hp: number; maxHp: number; turnOrder: number
}

export default function PartyWaitingRoom() {
  const { sessionId } = useParams()
  const { user } = useUser()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [players, setPlayers] = useState<WaitingPlayer[]>([])
  const [hostId, setHostId] = useState('')
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const isHost = user?.id === hostId
  const canStart = players.length >= 2

  useEffect(() => { loadSession() }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    const channel = supabase.channel(`party:${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` }, () => loadPlayers())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, (payload) => {
        if (payload.new.status === 'active') router.push(`/game/${sessionId}`)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  async function loadSession() {
    const { data } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    if (data) {
      setInviteCode(data.invite_code)
      setHostId(data.host_id)
      if (data.status === 'active') router.push(`/game/${sessionId}`)
    }
    await loadPlayers()
  }

  async function loadPlayers() {
    const data = await getSessionPlayers(sessionId as string)
    setPlayers(data.map((p: {
      id: string; user_id: string; users: { username: string; badge: string }
      normie_id: string; character_class: string; hp: number; max_hp: number; turn_order: number
    }) => ({
      id: p.id, userId: p.user_id, username: p.users?.username || 'Unknown',
      badge: p.users?.badge || 'adventurer', normieId: p.normie_id,
      characterClass: p.character_class, hp: p.hp, maxHp: p.max_hp, turnOrder: p.turn_order,
    })))
  }

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function startGame() {
    if (!canStart || !isHost) return
    setStarting(true)
    await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId)
    router.push(`/game/${sessionId}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', color: C.gold, letterSpacing: '0.1em' }}>⚔ NORMIE DUNGEONS</span>
        <button onClick={() => router.push('/lobby')}
          style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textDim, cursor: 'pointer', fontSize: '10px', padding: '6px 14px', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
          ← LEAVE
        </button>
      </motion.div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '10px', color: C.gold, letterSpacing: '0.3em', marginBottom: '8px' }}>ADVENTURERS GUILD — PARTY HALL</p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: C.text, margin: '0 0 8px', letterSpacing: '0.05em' }}>GATHERING ADVENTURERS</h1>
          <p style={{ fontSize: '11px', color: C.textDim, margin: 0 }}>{players.length} of 4 seats filled</p>
        </motion.div>

        {/* Invite code */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          style={{ border: `1px solid ${C.goldDim}`, background: '#1a1508', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
          <SectionDivider title="SESSION CODE" />
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '36px', color: C.gold, letterSpacing: '0.4em', margin: '0 0 16px' }}>{inviteCode}</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={copyCode}
            style={{ background: 'none', border: `1px solid ${copied ? C.gold : C.border}`, color: copied ? C.gold : C.textDim, padding: '8px 20px', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.15em', fontFamily: "'IBM Plex Mono', monospace" }}>
            {copied ? '✓ COPIED' : 'COPY CODE'}
          </motion.button>
          <p style={{ fontSize: '10px', color: C.textMuted, margin: '12px 0 0' }}>Share with up to 3 allies</p>
        </motion.div>

        {/* Player seats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <AnimatePresence>
            {players.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                style={{ border: `1px solid ${C.border}`, background: C.panel, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Image src={`https://api.normies.art/normie/${p.normieId}/image.png`} alt="" width={40} height={40}
                  style={{ imageRendering: 'pixelated', borderRadius: '2px', border: `1px solid ${C.border}` }} unoptimized />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{p.username}</span>
                    {p.userId === hostId && <span style={{ fontSize: '8px', color: C.gold, border: `1px solid ${C.goldDim}`, padding: '1px 6px', letterSpacing: '0.1em' }}>HOST</span>}
                    {p.badge === 'verified' && <span style={{ fontSize: '8px', color: C.gold }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: CLASS_COLORS[p.characterClass] || C.textDim }}>
                    {p.characterClass} — Normie #{p.normieId}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: C.textMuted }}>#{i + 1}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
            <motion.div key={`empty-${i}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (players.length + i) * 0.1 }}
              style={{ border: `1px dashed ${C.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', border: `1px dashed ${C.border}`, borderRadius: '2px', background: C.panelMid }} />
              <span style={{ fontSize: '11px', color: C.textMuted, letterSpacing: '0.1em' }}>AWAITING ADVENTURER...</span>
            </motion.div>
          ))}
        </div>

        {/* Start / wait */}
        {isHost ? (
          <motion.button whileHover={{ scale: canStart ? 1.02 : 1 }} whileTap={{ scale: canStart ? 0.98 : 1 }}
            onClick={startGame} disabled={!canStart || starting}
            style={{ width: '100%', background: canStart ? C.gold : C.panelMid, border: 'none', color: canStart ? '#0d0d0f' : C.textMuted, padding: '16px', cursor: canStart ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>
            {starting ? 'ENTERING DUNGEON...' : canStart ? `ENTER DUNGEON WITH ${players.length} ADVENTURERS →` : 'NEED AT LEAST 2 ADVENTURERS'}
          </motion.button>
        ) : (
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ textAlign: 'center', padding: '16px', border: `1px solid ${C.border}`, fontSize: '11px', color: C.textDim, letterSpacing: '0.1em' }}>
            AWAITING HOST TO BEGIN THE ADVENTURE...
          </motion.div>
        )}
      </div>
    </div>
  )
}