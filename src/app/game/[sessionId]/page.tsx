'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { DiceRoll } from '@/components/game/DiceRoll'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const C = {
  bg: '#0d0d0f',
  panel: '#13131a',
  panelMid: '#1a1a24',
  border: '#252535',
  gold: '#c8a85c',
  goldDim: '#4a3f25',
  text: '#e8e0d0',
  textDim: '#a09080',
  textMuted: '#504840',
  red: '#dc2626',
  green: '#16a34a',
  hp: '#dc2626',
}

interface Message {
  id: string
  type: 'player_action' | 'dm_narration' | 'system'
  content: string
  username?: string
  diceRoll?: number
  modifier?: number
  total?: number
  stat?: string
  createdAt: string
}

interface Player {
  id: string
  userId: string
  username: string
  badge: string
  normieId: string
  characterClass: string
  stats: Record<string, number>
  hp: number
  maxHp: number
  turnOrder: number
  isActive: boolean
}

interface GameState {
  dungeonName: string
  currentRoomDescription: string
  imageUrl?: string
  bossName?: string
  state: { phase: string; roomsCleared: number; startTime?: number }
}

interface SessionData {
  mode: string
  currentRoom: number
  totalRooms: number
  status: string
  hostId?: string
  inviteCode?: string
}

function mod(stat: number): string {
  const m = Math.floor((stat - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
      <span style={{ fontSize: '9px', color: C.gold, letterSpacing: '0.2em', fontFamily: 'Cinzel, serif', whiteSpace: 'nowrap' }}>
        ◆ {title} ◆
      </span>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
    </div>
  )
}

function HPBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, (hp / maxHp) * 100)
  const color = pct > 50 ? C.green : pct > 25 ? '#ca8a04' : C.red
  return (
    <div style={{ width: '100%', height: '3px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: '2px' }}
      />
    </div>
  )
}

export default function GameRoom() {
  const { sessionId } = useParams()
  const { user } = useUser()
  const router = useRouter()

  const [session, setSession] = useState<SessionData | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null)
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [pendingDiceRoll, setPendingDiceRoll] = useState<{ roll: number; modifier: number; total: number; stat: string } | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const myPlayer = players.find(p => p.userId === user?.id)
  const isMyTurn = currentTurnPlayerId === myPlayer?.id
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId)
  const latestDmMessage = messages.filter(m => m.type === 'dm_narration').slice(-1)[0]
  const activePlayers = players.filter(p => p.isActive)

  useEffect(() => {
    if (user) loadGame()
  }, [user, sessionId])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    const channel = supabase
      .channel(`game:${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` }, () => loadMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state', filter: `session_id=eq.${sessionId}` }, () => loadGameState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` }, () => loadPlayers())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  useEffect(() => {
    if (!loading && players.length > 0 && !gameState && !initializing) {
      const myPlayerInList = players.find(p => p.userId === user?.id)
      if (myPlayerInList?.turnOrder === 1) initializeGame(players)
    }
  }, [loading, players, gameState])

  async function loadGame() {
    setLoading(true)
    await Promise.all([loadSession(), loadPlayers(), loadGameState(), loadMessages()])
    setLoading(false)
  }

  async function loadSession() {
    const { data } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    if (data) setSession({ mode: data.mode, currentRoom: data.current_room, totalRooms: data.total_rooms, status: data.status, hostId: data.host_id, inviteCode: data.invite_code })
  }

  async function loadPlayers() {
    const { data } = await supabase.from('session_players').select('*, users(username, badge)').eq('session_id', sessionId).order('turn_order')
    if (data) {
      setPlayers(data.map((p: {
        id: string; user_id: string; users: { username: string; badge: string }
        normie_id: string; character_class: string; stats: Record<string, number>
        hp: number; max_hp: number; turn_order: number; is_active: boolean
      }) => ({
        id: p.id, userId: p.user_id, username: p.users?.username || 'Unknown',
        badge: p.users?.badge || 'adventurer', normieId: p.normie_id,
        characterClass: p.character_class, stats: p.stats, hp: p.hp,
        maxHp: p.max_hp, turnOrder: p.turn_order, isActive: p.is_active,
      })))
    }
  }

  async function loadGameState() {
    const { data } = await supabase.from('game_state').select('*').eq('session_id', sessionId).maybeSingle()
    if (data) {
      setGameState({ dungeonName: data.dungeon_name, currentRoomDescription: data.current_room_description, imageUrl: data.state?.imageUrl, bossName: data.state?.bossName, state: data.state })
      setCurrentTurnPlayerId(data.current_turn_player_id)
    }
  }

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*, session_players(users(username))').eq('session_id', sessionId).order('created_at')
    if (data) {
      setMessages(data.map((m: {
        id: string; type: string; content: string
        dice_roll: { result: number; modifier: number; total: number; stat: string } | null
        created_at: string; session_players: { users: { username: string } } | null
      }) => ({
        id: m.id, type: m.type, content: m.content,
        username: m.session_players?.users?.username,
        diceRoll: m.dice_roll?.result, modifier: m.dice_roll?.modifier,
        total: m.dice_roll?.total, stat: m.dice_roll?.stat,
        createdAt: m.created_at,
      })))
    }
  }

  async function initializeGame(playerList: Player[]) {
    if (initializing) return
    setInitializing(true)
    const res = await fetch('/api/dm/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        players: playerList.map(p => ({ username: p.username, characterClass: p.characterClass, normieId: p.normieId, stats: p.stats, hasScarredPassive: false })),
        mode: session?.mode || 'solo',
      }),
    })
    const { dungeonName, bossName, opening, imageUrl } = await res.json()

    const newState = { phase: 'exploration', roomsCleared: 0, bossName, imageUrl, startTime: Date.now() }

    await supabase.from('game_state').upsert({
      session_id: sessionId,
      current_turn_player_id: playerList[0].id,
      dungeon_name: dungeonName,
      dungeon_description: opening,
      current_room_description: opening,
      state: newState,
    }, { onConflict: 'session_id' }).select().single()

    setCurrentTurnPlayerId(playerList[0].id)
    setGameState({ dungeonName, currentRoomDescription: opening, imageUrl, bossName, state: newState })
    await supabase.from('messages').insert({ session_id: sessionId, type: 'dm_narration', content: opening })
    await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId)
    setInitializing(false)
  }

  async function submitAction() {
    if (!action.trim() || !myPlayer || !isMyTurn || submitting) return
    setSubmitting(true)
    const actionText = action.trim()
    setAction('')

    await supabase.from('messages').insert({ session_id: sessionId, player_id: myPlayer.id, type: 'player_action', content: actionText })

    const res = await fetch('/api/dm/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionText, player: { ...myPlayer, hasScarredPassive: false },
        allPlayers: players, dungeonName: gameState?.dungeonName,
        roomNumber: session?.currentRoom, totalRooms: session?.totalRooms,
        messageHistory: messages.slice(-6),
      }),
    })
    const result = await res.json()

    if (result.diceRoll) {
      setPendingDiceRoll({ roll: result.diceRoll, modifier: result.modifier, total: result.total, stat: result.stat })
    }

    await supabase.from('messages').insert({
      session_id: sessionId, type: 'dm_narration', content: result.narration,
      dice_roll: { result: result.diceRoll, modifier: result.modifier, total: result.total, stat: result.stat },
    })

    if (result.hpChange !== 0) {
      const newHp = Math.max(0, Math.min(myPlayer.maxHp, myPlayer.hp + result.hpChange))
      await supabase.from('session_players').update({ hp: newHp }).eq('id', myPlayer.id)
    }

    if (result.roomCleared && session) {
      const newRoom = session.currentRoom + 1
      await supabase.from('sessions').update({ current_room: newRoom }).eq('id', sessionId)
      await supabase.from('messages').insert({ session_id: sessionId, type: 'system', content: result.dungeonComplete ? 'The dungeon has been conquered.' : `Room ${session.currentRoom} cleared. The party presses deeper...` })
    }

    if (result.dungeonComplete) { await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId); router.push(`/game/${sessionId}/victory`); return }
    if (result.playerDefeated) { await supabase.from('session_players').update({ is_active: false, hp: 0 }).eq('id', myPlayer.id); router.push(`/game/${sessionId}/defeat`); return }

    const nextPlayer = getNextPlayer()
    if (nextPlayer) {
      await supabase.from('game_state').update({ current_turn_player_id: nextPlayer.id, updated_at: new Date().toISOString() }).eq('session_id', sessionId)
      setCurrentTurnPlayerId(nextPlayer.id)
    }
    setSubmitting(false)
  }

  function getNextPlayer(): Player | null {
    if (players.length <= 1) return myPlayer || null
    const active = players.filter(p => p.isActive)
    const idx = active.findIndex(p => p.id === currentTurnPlayerId)
    return active[(idx + 1) % active.length]
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  async function copyCode() {
    if (session?.inviteCode) {
      await navigator.clipboard.writeText(session.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading || initializing) {
    return (
      <div style={{ height: '100vh', background: '#0d0d0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontSize: '32px' }}>⚔</motion.div>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', color: '#c8a85c', letterSpacing: '0.2em' }}>
          {initializing ? 'THE DUNGEON MASTER PREPARES...' : 'ENTERING THE DUNGEON...'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace", display: 'flex', flexDirection: 'column' }}>

      {/* Top Bar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.panel, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', color: C.gold, letterSpacing: '0.1em' }}>⚔ NORMIE DUNGEONS</span>
          {session?.mode === 'party' && session.inviteCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: `1px solid ${C.border}`, paddingLeft: '16px' }}>
              <span style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em' }}>SESSION</span>
              <span style={{ fontSize: '12px', color: C.text, fontWeight: 600, letterSpacing: '0.1em' }}>{session.inviteCode}</span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={copyCode}
                style={{ fontSize: '9px', color: copied ? C.green : C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderLeft: `1px solid ${C.border}` }}>
                {copied ? '✓ COPIED' : 'COPY'}
              </motion.button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '13px', color: C.text, margin: 0, letterSpacing: '0.05em' }}>{gameState?.dungeonName || '...'}</p>
          <p style={{ fontSize: '10px', color: C.textDim, margin: 0, letterSpacing: '0.1em' }}>
            ROOM {session?.currentRoom} OF {session?.totalRooms}{session?.currentRoom === session?.totalRooms ? ' — BOSS ROOM' : ''}
          </p>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={async () => {
            if (myPlayer) {
              await supabase.from('session_players').update({ is_active: false }).eq('id', myPlayer.id)
              await supabase.from('messages').insert({ session_id: sessionId, type: 'system', content: `${user?.username} left the dungeon.` })
            }
            router.push('/lobby')
          }}
          style={{ fontSize: '10px', color: C.textDim, background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer', padding: '6px 14px', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
          ← LEAVE SESSION
        </motion.button>
      </motion.div>

      {/* Main 3-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, height: 0 }}>

        {/* LEFT PANEL */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '260px', flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.panel, overflow: 'hidden', minHeight: 0 }}>

          {/* Party list */}
          <div className="custom-scrollbar" style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, overflowY: 'auto', minHeight: 0, height: 0, flex: 1 }}>
            <SectionDivider title="PARTY" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.map(p => (
                <motion.div key={p.id}
                  animate={{ borderColor: p.id === currentTurnPlayerId ? C.gold : C.border }}
                  transition={{ duration: 0.3 }}
                  style={{ border: `1px solid`, borderRadius: '4px', padding: '10px', background: p.isActive ? C.panelMid : 'transparent', opacity: p.isActive ? 1 : 0.4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Image src={`https://api.normies.art/normie/${p.normieId}/image.png`} alt="" width={32} height={32}
                        style={{ imageRendering: 'pixelated', borderRadius: '2px', filter: p.isActive ? 'none' : 'grayscale(100%)' }} unoptimized />
                      {p.id === currentTurnPlayerId && (
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
                          style={{ position: 'absolute', inset: -2, border: `1px solid ${C.gold}`, borderRadius: '3px', pointerEvents: 'none' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: p.isActive ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</span>
                        {p.badge === 'verified' && <span style={{ fontSize: '8px', color: C.gold }}>✓</span>}
                        {!p.isActive && <span style={{ fontSize: '8px', color: C.textMuted }}>offline</span>}
                      </div>
                      <span style={{ fontSize: '10px', color: C.textDim }}>{p.characterClass}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: C.red }}>♥</span>
                    <span style={{ fontSize: '10px', color: C.textDim, minWidth: '50px' }}>{p.hp}/{p.maxHp}</span>
                    <div style={{ flex: 1 }}><HPBar hp={p.hp} maxHp={p.maxHp} /></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Character stat block */}
          {myPlayer && (
            <div className="custom-scrollbar" style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              <SectionDivider title="YOUR CHARACTER" />
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 2px', fontFamily: 'Cinzel, serif' }}>{myPlayer.username}</p>
                <p style={{ fontSize: '10px', color: C.gold, margin: 0, letterSpacing: '0.1em' }}>{myPlayer.characterClass} — Normie #{myPlayer.normieId}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '12px' }}>
                {Object.entries(myPlayer.stats).map(([key, val]) => (
                  <div key={key} style={{ background: C.panelMid, border: `1px solid ${C.border}`, padding: '6px 4px', textAlign: 'center', borderRadius: '2px' }}>
                    <div style={{ fontSize: '8px', color: C.textMuted, letterSpacing: '0.1em', marginBottom: '2px' }}>{key.toUpperCase()}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: '9px', color: C.gold }}>{mod(val)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '9px', color: C.red }}>♥</span>
                <span style={{ fontSize: '10px', color: C.textDim }}>{myPlayer.hp}/{myPlayer.maxHp} HP</span>
                <div style={{ flex: 1 }}><HPBar hp={myPlayer.hp} maxHp={myPlayer.maxHp} /></div>
              </div>
              {myPlayer.stats && (
                <div style={{ border: `1px solid ${C.goldDim}`, borderRadius: '2px', padding: '8px', background: C.parchment ?? '#1a1508' }}>
                  <p style={{ fontSize: '9px', color: C.gold, letterSpacing: '0.1em', margin: '0 0 4px' }}>PASSIVE</p>
                  <p style={{ fontSize: '10px', color: C.textDim, margin: 0, lineHeight: 1.5 }}>
                    {myPlayer.characterClass === 'Warrior' ? 'Stalwart — Reduced damage from physical hits' :
                      myPlayer.characterClass === 'Rogue' ? 'Shadow Step — Higher critical hit chance' :
                        myPlayer.characterClass === 'Mage' ? 'Arcane Surge — Spells deal bonus damage at full HP' :
                          myPlayer.characterClass === 'Ranger' ? 'Eagle Eye — Advantage on perception checks' :
                            myPlayer.characterClass === 'Bard' ? 'Inspire — Allies get +1 on their next roll' :
                              'Adapt — Bonus to rolls when below half HP'}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* CENTER PANEL */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* DM Narration */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: C.panel }}>
            <SectionDivider title="DM NARRATION" />
            <AnimatePresence mode="wait">
              {latestDmMessage ? (
                <motion.p key={latestDmMessage.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ fontSize: '13px', color: C.text, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                  {latestDmMessage.content}
                </motion.p>
              ) : (
                <p style={{ fontSize: '13px', color: C.textMuted, margin: 0, fontStyle: 'italic' }}>
                  The dungeon awaits your first move...
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* Dungeon scene image */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#080808', minHeight: '200px' }}>
            {gameState?.imageUrl && (
              <motion.img
                src={gameState.imageUrl}
                alt="Dungeon scene"
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
                transition={{ duration: 1 }}
                onLoad={() => setImageLoaded(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
            {!imageLoaded && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.p animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
                  style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.2em' }}>
                  RENDERING DUNGEON...
                </motion.p>
              </div>
            )}
            {/* Gradient overlay for readability */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,13,15,0.3) 0%, transparent 30%, transparent 70%, rgba(13,13,15,0.8) 100%)', pointerEvents: 'none' }} />
          </div>

          {/* Action input */}
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: C.panel, flexShrink: 0 }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em' }}>YOUR ACTION</span>
            </div>
            {isMyTurn ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitAction()}
                  placeholder="What do you do?"
                  disabled={submitting}
                  style={{ flex: 1, background: C.panelMid, border: `1px solid ${C.border}`, color: C.text, padding: '10px 14px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", outline: 'none', borderRadius: '2px' }}
                />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={submitAction}
                  disabled={!action.trim() || submitting}
                  style={{ padding: '10px 20px', background: submitting ? C.panelMid : C.gold, color: submitting ? C.textMuted : '#0d0d0f', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif', borderRadius: '2px', minWidth: '140px' }}>
                  {submitting ? '...' : 'SUBMIT ACTION →'}
                </motion.button>
              </div>
            ) : (
              <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
                style={{ textAlign: 'center', padding: '10px', border: `1px solid ${C.border}`, fontSize: '11px', color: C.textDim, letterSpacing: '0.1em' }}>
                WAITING FOR {currentTurnPlayer?.username?.toUpperCase() || 'NEXT PLAYER'}...
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* RIGHT PANEL */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          style={{ width: '260px', flexShrink: 0, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.panel, overflow: 'hidden', minHeight: 0 }}>

          {/* Turn order */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
            <SectionDivider title="TURN ORDER" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activePlayers.map((p, i) => (
                <motion.div key={p.id}
                  animate={{ background: p.id === currentTurnPlayerId ? C.goldDim : 'rgba(0,0,0,0)' }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '2px', border: `1px solid ${p.id === currentTurnPlayerId ? C.gold : 'transparent'}` }}>
                  <span style={{ fontSize: '11px', color: C.gold, fontFamily: 'Cinzel, serif', width: '16px' }}>{i + 1}</span>
                  <Image src={`https://api.normies.art/normie/${p.normieId}/image.png`} alt="" width={24} height={24}
                    style={{ imageRendering: 'pixelated', borderRadius: '2px' }} unoptimized />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', color: C.text, margin: 0 }}>{p.username}</p>
                    <p style={{ fontSize: '9px', color: C.textDim, margin: 0 }}>{p.characterClass}</p>
                  </div>
                  {p.userId === user?.id && (
                    <span style={{ fontSize: '9px', color: C.gold }}>(You)</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div className="custom-scrollbar" style={{ flex: 1, padding: '16px', overflowY: 'scroll', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0, height: 0 }}>
            <SectionDivider title="ACTIVITY LOG" />
            <AnimatePresence>
              {messages.map(m => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ fontSize: '11px', lineHeight: 1.6 }}>
                  {m.type === 'dm_narration' && (
                    <div>
                      <span style={{ color: C.gold, fontSize: '9px', letterSpacing: '0.1em' }}>DM</span>
                      {m.diceRoll && (
                        <span style={{ color: C.textMuted, fontSize: '9px', marginLeft: '6px' }}>
                          [{m.stat} {m.diceRoll} → {m.total}]
                        </span>
                      )}
                      <p style={{ color: C.textDim, margin: '2px 0 0', fontSize: '10px' }}>{m.content.slice(0, 120)}{m.content.length > 120 ? '...' : ''}</p>
                    </div>
                  )}
                  {m.type === 'player_action' && (
                    <div>
                      <span style={{ color: m.username === user?.username ? C.text : C.textDim, fontSize: '9px', letterSpacing: '0.05em' }}>
                        {m.username} {m.username === user?.username ? '(You)' : ''}
                      </span>
                      <p style={{ color: C.textDim, margin: '2px 0 0', fontSize: '10px', fontStyle: 'italic' }}>{m.content}</p>
                    </div>
                  )}
                  {m.type === 'system' && (
                    <p style={{ color: C.textMuted, fontSize: '9px', letterSpacing: '0.05em', textAlign: 'center', borderTop: `1px solid ${C.border}`, paddingTop: '6px', margin: 0 }}>{m.content}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        </motion.div>
      </div>

      {/* Bottom progress bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
        style={{ borderTop: `1px solid ${C.border}`, padding: '10px 20px', background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em' }}>DUNGEON PROGRESS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {Array.from({ length: session?.totalRooms || 6 }).map((_, i) => {
              const isLast = i === (session?.totalRooms || 6) - 1
              const isCurrent = i === (session?.currentRoom || 1) - 1
              const isPast = i < (session?.currentRoom || 1) - 1
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <motion.div
                    animate={{ background: isPast || isCurrent ? C.gold : 'transparent', borderColor: isPast || isCurrent ? C.gold : C.border }}
                    transition={{ duration: 0.5 }}
                    style={{ width: isLast ? 'auto' : '10px', height: '10px', borderRadius: isLast ? '0' : '50%', border: isLast ? 'none' : '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isLast ? '14px' : '0' }}>
                    {isLast && <span style={{ color: isCurrent || isPast ? C.gold : C.textMuted }}>☠</span>}
                  </motion.div>
                  {!isLast && <div style={{ width: '16px', height: '1px', background: isPast ? C.gold : C.border, margin: '0 2px' }} />}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em' }}>BOSS — </span>
          <span style={{ fontSize: '10px', color: C.text, letterSpacing: '0.05em' }}>{gameState?.bossName || '???'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em' }}>SESSION TIME</span>
          <span style={{ fontSize: '12px', color: C.text, fontFamily: 'Cinzel, serif' }}>{formatTime(sessionTime)}</span>
        </div>
      </motion.div>

      {pendingDiceRoll && (
        <DiceRoll roll={pendingDiceRoll.roll} modifier={pendingDiceRoll.modifier} total={pendingDiceRoll.total} stat={pendingDiceRoll.stat} onComplete={() => setPendingDiceRoll(null)} />
      )}
    </div>
  )
}