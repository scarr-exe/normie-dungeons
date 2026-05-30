'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import Image from 'next/image'

interface Message {
    id: string
    type: 'player_action' | 'dm_narration' | 'system'
    content: string
    username?: string
    diceRoll?: number
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
    state: {
        phase: string
        roomsCleared: number
    }
}

export default function GameRoom() {
    const { sessionId } = useParams()
    const { user } = useUser()
    const router = useRouter()

    const [session, setSession] = useState<{ mode: string; currentRoom: number; totalRooms: number; status: string } | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [gameState, setGameState] = useState<GameState | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null)
    const [action, setAction] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [initializing, setInitializing] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const myPlayer = players.find(p => p.userId === user?.id)
    const isMyTurn = currentTurnPlayerId === myPlayer?.id
    const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId)

    useEffect(() => {
        if (user) loadGame()
    }, [user, sessionId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (!sessionId) return

        const channel = supabase
            .channel(`game:${sessionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${sessionId}`,
            }, () => loadMessages())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'game_state',
                filter: `session_id=eq.${sessionId}`,
            }, () => loadGameState())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_players',
                filter: `session_id=eq.${sessionId}`,
            }, () => loadPlayers())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [sessionId])

    async function loadGame() {
        setLoading(true)
        await Promise.all([loadSession(), loadPlayers(), loadGameState(), loadMessages()])
        setLoading(false)
    }

    async function loadSession() {
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single()
        if (data) setSession({
            mode: data.mode,
            currentRoom: data.current_room,
            totalRooms: data.total_rooms,
            status: data.status,
        })
    }

    async function loadPlayers() {
        const { data } = await supabase
            .from('session_players')
            .select('*, users(username, badge)')
            .eq('session_id', sessionId)
            .order('turn_order')

        if (data) {
            const formatted = data.map((p: {
                id: string
                user_id: string
                users: { username: string; badge: string }
                normie_id: string
                character_class: string
                stats: Record<string, number>
                hp: number
                max_hp: number
                turn_order: number
                is_active: boolean
            }) => ({
                id: p.id,
                userId: p.user_id,
                username: p.users?.username || 'Unknown',
                badge: p.users?.badge || 'adventurer',
                normieId: p.normie_id,
                characterClass: p.character_class,
                stats: p.stats,
                hp: p.hp,
                maxHp: p.max_hp,
                turnOrder: p.turn_order,
                isActive: p.is_active,
            }))
            setPlayers(formatted)
        }
    }

    async function loadGameState() {
        const { data } = await supabase
            .from('game_state')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle()

        if (data) {
            setGameState({
                dungeonName: data.dungeon_name,
                currentRoomDescription: data.current_room_description,
                state: data.state,
            })
            setCurrentTurnPlayerId(data.current_turn_player_id)
        }
    }

    async function loadMessages() {
        const { data } = await supabase
            .from('messages')
            .select('*, session_players(users(username))')
            .eq('session_id', sessionId)
            .order('created_at')

        if (data) {
            setMessages(data.map((m: {
                id: string
                type: string
                content: string
                dice_roll: { result: number; total: number; stat: string } | null
                created_at: string
                session_players: { users: { username: string } } | null
            }) => ({
                id: m.id,
                type: m.type,
                content: m.content,
                username: m.session_players?.users?.username,
                diceRoll: m.dice_roll?.result,
                total: m.dice_roll?.total,
                stat: m.dice_roll?.stat,
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
                players: playerList.map(p => ({
                    username: p.username,
                    characterClass: p.characterClass,
                    normieId: p.normieId,
                    stats: p.stats,
                    hasScarredPassive: false,
                })),
                mode: session?.mode || 'solo',
            }),
        })

        const { dungeonName, opening } = await res.json()

        const { data: gs } = await supabase
            .from('game_state')
            .insert({
                session_id: sessionId,
                current_turn_player_id: playerList[0].id,
                dungeon_name: dungeonName,
                dungeon_description: opening,
                current_room_description: opening,
                state: { phase: 'exploration', roomsCleared: 0 },
            })
            .select()
            .single()

        if (gs) {
            setCurrentTurnPlayerId(playerList[0].id)
            setGameState({
                dungeonName,
                currentRoomDescription: opening,
                state: { phase: 'exploration', roomsCleared: 0 },
            })
        }

        await supabase.from('messages').insert({
            session_id: sessionId,
            type: 'dm_narration',
            content: opening,
        })

        await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId)
        setInitializing(false)
    }

    useEffect(() => {
        if (!loading && players.length > 0 && !gameState && !initializing) {
            initializeGame(players)
        }
    }, [loading, players, gameState])

    async function submitAction() {
        if (!action.trim() || !myPlayer || !isMyTurn || submitting) return
        setSubmitting(true)

        const actionText = action.trim()
        setAction('')

        await supabase.from('messages').insert({
            session_id: sessionId,
            player_id: myPlayer.id,
            type: 'player_action',
            content: actionText,
        })

        const res = await fetch('/api/dm/turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: actionText,
                player: {
                    ...myPlayer,
                    hasScarredPassive: false,
                },
                allPlayers: players,
                dungeonName: gameState?.dungeonName,
                roomNumber: session?.currentRoom,
                totalRooms: session?.totalRooms,
                messageHistory: messages.slice(-6),
            }),
        })

        const result = await res.json()

        await supabase.from('messages').insert({
            session_id: sessionId,
            type: 'dm_narration',
            content: result.narration,
            dice_roll: {
                result: result.diceRoll,
                modifier: result.modifier,
                total: result.total,
                stat: result.stat,
            },
        })

        if (result.hpChange !== 0) {
            const newHp = Math.max(0, Math.min(myPlayer.maxHp, myPlayer.hp + result.hpChange))
            await supabase
                .from('session_players')
                .update({ hp: newHp })
                .eq('id', myPlayer.id)
        }

        if (result.roomCleared && session) {
            const newRoom = session.currentRoom + 1
            await supabase.from('sessions').update({ current_room: newRoom }).eq('id', sessionId)

            await supabase.from('messages').insert({
                session_id: sessionId,
                type: 'system',
                content: result.dungeonComplete
                    ? 'The dungeon has been conquered.'
                    : `Room ${session.currentRoom} cleared. Proceeding deeper...`,
            })
        }

        if (result.dungeonComplete) {
            await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
            router.push(`/game/${sessionId}/victory`)
            return
        }

        if (result.playerDefeated) {
            await supabase.from('session_players').update({ is_active: false, hp: 0 }).eq('id', myPlayer.id)
            router.push(`/game/${sessionId}/defeat`)
            return
        }

        const nextPlayer = getNextPlayer()
        if (nextPlayer) {
            await supabase
                .from('game_state')
                .update({ current_turn_player_id: nextPlayer.id, updated_at: new Date().toISOString() })
                .eq('session_id', sessionId)
            setCurrentTurnPlayerId(nextPlayer.id)
        }

        setSubmitting(false)
    }

    function getNextPlayer(): Player | null {
        if (players.length <= 1) return myPlayer || null
        const activePlayers = players.filter(p => p.isActive)
        const currentIndex = activePlayers.findIndex(p => p.id === currentTurnPlayerId)
        return activePlayers[(currentIndex + 1) % activePlayers.length]
    }

    if (loading || initializing) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-lg font-semibold mb-2">
                        {initializing ? 'The Dungeon Master is preparing your adventure...' : 'Loading...'}
                    </p>
                    <p className="text-zinc-500 text-sm">This takes a moment</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold">{gameState?.dungeonName || 'The Dungeon'}</p>
                    <p className="text-zinc-500 text-xs">
                        Room {session?.currentRoom} of {session?.totalRooms}
                        {session?.currentRoom === session?.totalRooms ? ' — Boss Room' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {session?.mode === 'party' && (
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">
                            Party Mode
                        </span>
                    )}
                    <div className="flex gap-1">
                        {Array.from({ length: session?.totalRooms || 6 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < (session?.currentRoom || 1)
                                        ? 'bg-white'
                                        : 'bg-zinc-700'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar — players */}
                <div className="w-56 border-r border-zinc-800 p-4 flex-shrink-0 overflow-y-auto">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Party</p>
                    <div className="space-y-3">
                        {players.map(p => (
                            <div
                                key={p.id}
                                className={`rounded-xl p-3 border transition-colors ${p.id === currentTurnPlayerId
                                        ? 'border-white bg-zinc-800'
                                        : 'border-zinc-700 bg-zinc-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Image
                                        src={`https://api.normies.art/normie/${p.normieId}/image.png`}
                                        alt={`Normie #${p.normieId}`}
                                        width={28}
                                        height={28}
                                        className="rounded"
                                        style={{ imageRendering: 'pixelated' }}
                                        unoptimized
                                    />
                                    <div>
                                        <p className="text-white text-xs font-medium">{p.username}</p>
                                        <p className="text-zinc-500 text-xs">{p.characterClass}</p>
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-700 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${p.hp / p.maxHp > 0.5 ? 'bg-green-500' :
                                                p.hp / p.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
                                    />
                                </div>
                                <p className="text-zinc-400 text-xs mt-1">{p.hp}/{p.maxHp} HP</p>
                                {p.id === currentTurnPlayerId && (
                                    <p className="text-white text-xs mt-1 font-medium">← Turn</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main — message log */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map(m => (
                            <div key={m.id}>
                                {m.type === 'dm_narration' && (
                                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 max-w-2xl">
                                        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
                                            Dungeon Master
                                            {m.diceRoll && (
                                                <span className="ml-2 text-zinc-600">
                                                    [{m.stat} roll: {m.diceRoll} → {m.total}]
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-zinc-200 text-sm leading-relaxed">{m.content}</p>
                                    </div>
                                )}
                                {m.type === 'player_action' && (
                                    <div className={`flex ${m.username === user?.username ? 'justify-end' : 'justify-start'}`}>
                                        <div className="bg-zinc-800 rounded-xl px-4 py-2 max-w-sm">
                                            <p className="text-zinc-500 text-xs mb-1">{m.username}</p>
                                            <p className="text-white text-sm">{m.content}</p>
                                        </div>
                                    </div>
                                )}
                                {m.type === 'system' && (
                                    <div className="text-center">
                                        <span className="text-zinc-500 text-xs bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700">
                                            {m.content}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Action input */}
                    <div className="border-t border-zinc-800 p-4">
                        {isMyTurn ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="What do you do?"
                                    value={action}
                                    onChange={e => setAction(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && submitAction()}
                                    disabled={submitting}
                                    className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 text-sm"
                                />
                                <button
                                    onClick={submitAction}
                                    disabled={!action.trim() || submitting}
                                    className="bg-white text-black font-semibold px-5 py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition-colors text-sm"
                                >
                                    {submitting ? '...' : 'Act'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-center text-zinc-500 text-sm">
                                Waiting for {currentTurnPlayer?.username || 'next player'}...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}