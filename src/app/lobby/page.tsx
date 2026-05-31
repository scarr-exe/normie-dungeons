'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { NormieSelector } from '@/components/game/NormieSelector'
import { CharacterSheet } from '@/components/game/CharacterSheet'
import { createSession, joinSession, addPlayerToSession, getSessionPlayers } from '@/lib/sessions'
import { NormieCharacter } from '@/types/normie'
import { useRouter } from 'next/navigation'

type LobbyStep = 'choose_mode' | 'select_normie' | 'join_code'

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

  useEffect(() => {
    if (!userLoading && !user) router.push('/')
  }, [userLoading, user])

  function handleModeSelect(mode: 'solo' | 'party') {
    setPendingMode(mode)
    setStep('select_normie')
  }

  async function handleStartGame() {
    if (!user || !selectedNormie) return
    setLoading(true)
    setError('')

    const session = await createSession(user.id, pendingMode)
    if (!session) {
      setError('Failed to create session. Try again.')
      setLoading(false)
      return
    }

    const added = await addPlayerToSession(
      session.id, user.id, selectedNormie.id,
      selectedNormie.characterClass, selectedNormie.stats,
      selectedNormie.maxHp, 1
    )

    if (!added) {
      setError('Failed to join session. Try again.')
      setLoading(false)
      return
    }

    if (pendingMode === 'party') {
      router.push(`/party/${session.id}`)
    } else {
      router.push(`/game/${session.id}`)
    }
  }

  async function handleJoinSession() {
    if (!user || !selectedNormie || !joinCode) return
    setLoading(true)
    setError('')

    const session = await joinSession(joinCode)
    if (!session) {
      setError('Session not found or already started. Check the code and try again.')
      setLoading(false)
      return
    }

    const players = await getSessionPlayers(session.id)
    const alreadyIn = players.find((p: { user_id: string }) => p.user_id === user.id)

    if (alreadyIn) {
      router.push(`/party/${session.id}`)
      return
    }

    const turnOrder = players.length + 1
    if (turnOrder > 4) {
      setError('This session is full.')
      setLoading(false)
      return
    }

    const added = await addPlayerToSession(
      session.id, user.id, selectedNormie.id,
      selectedNormie.characterClass, selectedNormie.stats,
      selectedNormie.maxHp, turnOrder
    )

    if (!added) {
      setError('Failed to join. Try again.')
      setLoading(false)
      return
    }

    router.push(`/party/${session.id}`)
  }

  if (userLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Step 1 — Choose mode */}
        {step === 'choose_mode' && (
          <div>
            <p className="text-zinc-400 text-sm mb-1">Welcome, {user.username}</p>
            <h1 className="text-white text-2xl font-bold mb-8">Choose Your Path</h1>
            <div className="space-y-3">
              <button
                onClick={() => handleModeSelect('solo')}
                className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-400 rounded-xl p-5 text-left transition-colors"
              >
                <p className="text-white font-semibold mb-1">Solo Adventure</p>
                <p className="text-zinc-400 text-sm">Face the dungeon alone. Your choices, your fate.</p>
              </button>
              <button
                onClick={() => handleModeSelect('party')}
                className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-400 rounded-xl p-5 text-left transition-colors"
              >
                <p className="text-white font-semibold mb-1">Create Party</p>
                <p className="text-zinc-400 text-sm">Host a dungeon for up to 4 adventurers.</p>
              </button>
              <button
                onClick={() => { setPendingMode('party'); setStep('join_code') }}
                className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-400 rounded-xl p-5 text-left transition-colors"
              >
                <p className="text-white font-semibold mb-1">Join Party</p>
                <p className="text-zinc-400 text-sm">Enter an invite code to join a friend's dungeon.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Select Normie (solo/create party) */}
        {step === 'select_normie' && !selectedNormie && (
          <div>
            <button onClick={() => setStep('choose_mode')} className="text-zinc-500 text-sm mb-6 hover:text-zinc-300 transition-colors">
              ← Back
            </button>
            <NormieSelector onSelect={setSelectedNormie} />
          </div>
        )}

        {step === 'select_normie' && selectedNormie && (
          <div>
            <button onClick={() => setSelectedNormie(null)} className="text-zinc-500 text-sm mb-6 hover:text-zinc-300 transition-colors">
              ← Choose different Normie
            </button>
            <CharacterSheet normie={selectedNormie} />
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <button
              onClick={handleStartGame}
              disabled={loading}
              className="w-full mt-4 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Creating dungeon...' : 'Enter Dungeon'}
            </button>
          </div>
        )}

        {/* Step 3 — Join flow (code + normie selection stays in join_code step) */}
        {step === 'join_code' && (
          <div>
            <button
              onClick={() => { setStep('choose_mode'); setJoinCodeConfirmed(false); setSelectedNormie(null) }}
              className="text-zinc-500 text-sm mb-6 hover:text-zinc-300 transition-colors"
            >
              ← Back
            </button>

            {/* Enter code */}
            {!joinCodeConfirmed && (
              <>
                <h2 className="text-white text-xl font-bold mb-2">Enter Invite Code</h2>
                <p className="text-zinc-400 text-sm mb-6">Ask your party host for their 6-character code.</p>
                <input
                  type="text"
                  placeholder="NRM-XXX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 mb-4 font-mono text-lg tracking-widest"
                />
                <button
                  onClick={() => setJoinCodeConfirmed(true)}
                  disabled={joinCode.length < 7}
                  className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                >
                  Find Session
                </button>
              </>
            )}

            {/* Select Normie for join */}
            {joinCodeConfirmed && !selectedNormie && (
              <>
                <p className="text-zinc-400 text-sm mb-2">
                  Joining session <span className="text-white font-mono">{joinCode}</span>
                </p>
                <NormieSelector onSelect={setSelectedNormie} />
              </>
            )}

            {/* Confirm and join */}
            {joinCodeConfirmed && selectedNormie && (
              <>
                <p className="text-zinc-400 text-sm mb-4">
                  Joining session <span className="text-white font-mono">{joinCode}</span>
                </p>
                <button onClick={() => setSelectedNormie(null)} className="text-zinc-500 text-sm mb-6 hover:text-zinc-300 transition-colors">
                  ← Choose different Normie
                </button>
                <CharacterSheet normie={selectedNormie} />
                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                <button
                  onClick={handleJoinSession}
                  disabled={loading}
                  className="w-full mt-4 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Joining...' : 'Join Dungeon'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </main>
  )
}