'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { getSessionPlayers } from '@/lib/sessions'
import Image from 'next/image'

interface WaitingPlayer {
  id: string
  userId: string
  username: string
  badge: string
  normieId: string
  characterClass: string
  hp: number
  maxHp: number
  turnOrder: number
}

const CLASS_COLORS: Record<string, string> = {
  Warrior: 'text-red-400',
  Rogue: 'text-yellow-400',
  Mage: 'text-blue-400',
  Ranger: 'text-green-400',
  Bard: 'text-purple-400',
  Adventurer: 'text-zinc-400',
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

  useEffect(() => {
    loadSession()
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`party:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_players',
        filter: `session_id=eq.${sessionId}`,
      }, () => loadPlayers())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.new.status === 'active') {
          router.push(`/game/${sessionId}`)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  async function loadSession() {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (data) {
      setInviteCode(data.invite_code)
      setHostId(data.host_id)
      if (data.status === 'active') {
        router.push(`/game/${sessionId}`)
      }
    }

    await loadPlayers()
  }

  async function loadPlayers() {
    const data = await getSessionPlayers(sessionId as string)
    const formatted = data.map((p: {
      id: string
      user_id: string
      users: { username: string; badge: string }
      normie_id: string
      character_class: string
      hp: number
      max_hp: number
      turn_order: number
    }) => ({
      id: p.id,
      userId: p.user_id,
      username: p.users?.username || 'Unknown',
      badge: p.users?.badge || 'adventurer',
      normieId: p.normie_id,
      characterClass: p.character_class,
      hp: p.hp,
      maxHp: p.max_hp,
      turnOrder: p.turn_order,
    }))
    setPlayers(formatted)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function startGame() {
    if (!canStart || !isHost) return
    setStarting(true)

    await supabase
      .from('sessions')
      .update({ status: 'active' })
      .eq('id', sessionId)

    router.push(`/game/${sessionId}`)
  }

  async function leaveSession() {
    if (!user) return
    await supabase
      .from('session_players')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id)

    router.push('/lobby')
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
            Party Dungeon
          </p>
          <h1 className="text-white text-2xl font-bold mb-1">Waiting for Adventurers</h1>
          <p className="text-zinc-400 text-sm">
            {players.length}/4 players joined
          </p>
        </div>

        {/* Invite code */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6 text-center">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">
            Invite Code
          </p>
          <p className="text-white text-4xl font-bold font-mono tracking-widest mb-4">
            {inviteCode}
          </p>
          <button
            onClick={copyCode}
            className="bg-zinc-800 text-zinc-300 text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
          <p className="text-zinc-600 text-xs mt-3">
            Share this code with up to 3 friends
          </p>
        </div>

        {/* Player list */}
        <div className="space-y-3 mb-6">
          {players.map((p, i) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex items-center gap-4"
            >
              <Image
                src={`https://api.normies.art/normie/${p.normieId}/image.png`}
                alt={`Normie #${p.normieId}`}
                width={44}
                height={44}
                className="rounded-lg border border-zinc-700"
                style={{ imageRendering: 'pixelated' }}
                unoptimized
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{p.username}</p>
                  {p.badge === 'verified' && (
                    <span className="text-xs text-zinc-400">✓</span>
                  )}
                  {p.userId === hostId && (
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </div>
                <p className={`text-sm ${CLASS_COLORS[p.characterClass] || 'text-zinc-400'}`}>
                  {p.characterClass} — Normie #{p.normieId}
                </p>
                <p className="text-zinc-500 text-xs">{p.hp} HP</p>
              </div>
              <p className="text-zinc-600 text-xs">#{i + 1}</p>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-lg border border-dashed border-zinc-700 bg-zinc-800" />
              <p className="text-zinc-600 text-sm">Waiting for player...</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <button
              onClick={startGame}
              disabled={!canStart || starting}
              className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {starting
                ? 'Starting...'
                : canStart
                ? `Start with ${players.length} Players`
                : 'Need at least 2 players to start'}
            </button>
          )}

          {!isHost && (
            <div className="text-center py-3">
              <p className="text-zinc-400 text-sm">
                Waiting for the host to start the game...
              </p>
            </div>
          )}

          <button
            onClick={leaveSession}
            className="w-full text-zinc-500 text-sm py-2 hover:text-zinc-300 transition-colors"
          >
            Leave Session
          </button>
        </div>

      </div>
    </main>
  )
}