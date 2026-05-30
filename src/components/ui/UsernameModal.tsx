'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'

export function UsernameModal({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createUser } = useUser()

  async function handleSubmit() {
    const trimmed = username.trim()

    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores allowed')
      return
    }

    setLoading(true)
    setError('')

    // Check if username is taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', trimmed)
      .single()

    if (existing) {
      setError('Username already taken')
      setLoading(false)
      return
    }

    const user = await createUser(trimmed)

    if (!user) {
      setError('Something went wrong. Try again.')
      setLoading(false)
      return
    }

    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Enter the Dungeon</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Choose your name, adventurer. Connect your wallet to verify Normie ownership.
        </p>

        <div className="mb-6">
          <ConnectButton />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            maxLength={20}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !username.trim()}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Setting up...' : 'Enter Dungeon'}
        </button>

        <p className="text-zinc-500 text-xs mt-4 text-center">
          Wallet connection is optional. Normie holders get a verified badge.
        </p>
      </div>
    </div>
  )
}