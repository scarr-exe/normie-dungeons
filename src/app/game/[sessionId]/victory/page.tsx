'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'

const C = { bg: '#0d0d0f', panel: '#13131a', border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25', text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', green: '#16a34a' }

interface Player { username: string; characterClass: string; normieId: string; hp: number; maxHp: number }

export default function VictoryPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [dungeonName, setDungeonName] = useState('')
  const [bossName, setBossName] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadVictoryData() }, [sessionId])

  async function loadVictoryData() {
    const { data: gs } = await supabase.from('game_state').select('dungeon_name, state').eq('session_id', sessionId).single()
    if (gs) { setDungeonName(gs.dungeon_name); setBossName(gs.state?.bossName || 'The Final Guardian') }
    const { data: sp } = await supabase.from('session_players').select('*, users(username)').eq('session_id', sessionId)
    if (sp) setPlayers(sp.map((p: { users: { username: string }; character_class: string; normie_id: string; hp: number; max_hp: number }) => ({ username: p.users?.username || 'Unknown', characterClass: p.character_class, normieId: p.normie_id, hp: p.hp, maxHp: p.max_hp })))
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).eq('type', 'player_action')
    if (count) setMessageCount(count)
  }

  async function shareVictory() {
    const playerList = players.map(p => `${p.username} (${p.characterClass})`).join(', ')
    const text = `⚔ We conquered "${dungeonName}" and defeated ${bossName} in Normie Dungeons!\n\nParty: ${playerList}\nActions taken: ${messageCount}\n\nnormie-dungeons.vercel.app`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '480px' }}>

        <div style={{ border: `1px solid ${C.goldDim}`, background: '#1a1508', padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} style={{ fontSize: '48px', margin: '0 0 16px' }}>⚔</motion.p>
          <p style={{ fontSize: '10px', color: C.gold, letterSpacing: '0.3em', marginBottom: '8px' }}>DUNGEON CONQUERED</p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: C.text, margin: '0 0 4px', letterSpacing: '0.05em' }}>{dungeonName}</h1>
          <p style={{ fontSize: '11px', color: C.textDim, margin: '0 0 8px' }}>{bossName} has been defeated</p>
          <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>{messageCount} actions taken</p>
        </div>

        <div style={{ border: `1px solid ${C.border}`, background: C.panel, padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
            <span style={{ fontSize: '9px', color: C.gold, letterSpacing: '0.2em', fontFamily: 'Cinzel, serif' }}>◆ THE PARTY ◆</span>
            <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map(p => (
              <div key={p.username} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', border: `1px solid ${C.border}` }}>
                <Image src={`https://api.normies.art/normie/${p.normieId}/image.png`} alt="" width={32} height={32} style={{ imageRendering: 'pixelated', borderRadius: '2px' }} unoptimized />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: C.text, margin: 0 }}>{p.username}</p>
                  <p style={{ fontSize: '10px', color: C.textDim, margin: 0 }}>{p.characterClass} — Normie #{p.normieId}</p>
                </div>
                <p style={{ fontSize: '10px', color: C.textDim, margin: 0 }}>{p.hp}/{p.maxHp} HP</p>
              </div>
            ))}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={shareVictory}
          style={{ width: '100%', background: C.gold, border: 'none', color: '#0d0d0f', padding: '14px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif', marginBottom: '8px' }}>
          {copied ? '✓ COPIED TO CLIPBOARD' : 'SHARE VICTORY →'}
        </motion.button>

        <button onClick={() => router.push('/lobby')}
          style={{ width: '100%', background: 'none', border: `1px solid ${C.border}`, color: C.textDim, padding: '12px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
          ENTER ANOTHER DUNGEON
        </button>
      </motion.div>
    </div>
  )
}