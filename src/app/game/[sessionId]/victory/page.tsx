'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Player {
  username: string
  characterClass: string
  normieId: string
  hp: number
  maxHp: number
}

export default function VictoryPage() {
  const { sessionId } = useParams()
  const router = useRouter()
  const [dungeonName, setDungeonName] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadVictoryData()
  }, [sessionId])

  async function loadVictoryData() {
    const { data: gs } = await supabase
      .from('game_state')
      .select('dungeon_name')
      .eq('session_id', sessionId)
      .single()

    if (gs) setDungeonName(gs.dungeon_name)

    const { data: sp } = await supabase
      .from('session_players')
      .select('*, users(username)')
      .eq('session_id', sessionId)

    if (sp) {
      setPlayers(sp.map((p: {
        users: { username: string }
        character_class: string
        normie_id: string
        hp: number
        max_hp: number
      }) => ({
        username: p.users?.username || 'Unknown',
        characterClass: p.character_class,
        normieId: p.normie_id,
        hp: p.hp,
        maxHp: p.max_hp,
      })))
    }

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('type', 'player_action')

    if (count) setMessageCount(count)
  }

  async function shareVictory() {
    const playerList = players.map(p =>
      `${p.username} (${p.characterClass} #${p.normieId})`
    ).join(', ')

    const text = `⚔ We conquered "${dungeonName}" in Normie Dungeons!\n\nParty: ${playerList}\nTotal actions: ${messageCount}\n\nPlay at normie-dungeons.vercel.app`

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Victory card */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 mb-6 text-center">
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-5xl mb-4"
          >
            ⚔
          </motion.p>

          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
            Dungeon Conquered
          </p>
          <h1 className="text-white text-2xl font-bold mb-1">{dungeonName}</h1>
          <p className="text-zinc-500 text-sm mb-6">{messageCount} actions taken</p>

          {/* Players */}
          <div className="space-y-2 mb-6">
            {players.map((p) => (
              <div
                key={p.username}
                className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3"
              >
                <Image
                  src={`https://api.normies.art/normie/${p.normieId}/image.png`}
                  alt={`Normie #${p.normieId}`}
                  width={32}
                  height={32}
                  className="rounded"
                  style={{ imageRendering: 'pixelated' }}
                  unoptimized
                />
                <div className="text-left flex-1">
                  <p className="text-white text-sm font-medium">{p.username}</p>
                  <p className="text-zinc-500 text-xs">
                    {p.characterClass} — Normie #{p.normieId}
                  </p>
                </div>
                <p className="text-zinc-400 text-xs">{p.hp}/{p.maxHp} HP</p>
              </div>
            ))}
          </div>

          <button
            onClick={shareVictory}
            className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors mb-3"
          >
            {copied ? '✓ Copied to clipboard' : 'Share Victory'}
          </button>
        </div>

        <button
          onClick={() => router.push('/lobby')}
          className="w-full text-zinc-500 text-sm py-2 hover:text-zinc-300 transition-colors"
        >
          Enter Another Dungeon
        </button>
      </motion.div>
    </main>
  )
}