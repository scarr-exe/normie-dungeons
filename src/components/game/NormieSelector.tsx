'use client'

import { useState } from 'react'
import { useNormie } from '@/hooks/useNormie'
import { useWalletNormies } from '@/hooks/useWalletNormies'
import { CharacterSheet } from './CharacterSheet'
import { NormieCharacter } from '@/types/normie'
import { useAccount } from 'wagmi'

export function NormieSelector({
  onSelect,
}: {
  onSelect: (normie: NormieCharacter) => void
}) {
  const [tab, setTab] = useState<'id' | 'wallet'>('id')
  const [input, setInput] = useState('')
  const { normie, loading, error, fetchNormie } = useNormie()
  const { normieIds, loading: walletLoading } = useWalletNormies()
  const { isConnected } = useAccount()

  return (
    <div className="w-full max-w-md">
      <h2 className="text-white text-xl font-bold mb-2">Choose Your Normie</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Enter any Normie ID or pick one you own.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('id')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'id'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Enter ID
        </button>
        <button
          onClick={() => setTab('wallet')}
          disabled={!isConnected}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'wallet'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          My Normies {!isConnected && '(connect wallet)'}
        </button>
      </div>

      {/* Enter ID tab */}
      {tab === 'id' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Normie ID (e.g. 42)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchNormie(input)}
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              min="1"
              max="10000"
            />
            <button
              onClick={() => fetchNormie(input)}
              disabled={!input || loading}
              className="bg-white text-black font-semibold px-4 py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {normie && (
            <CharacterSheet normie={normie} onConfirm={() => onSelect(normie)} />
          )}
        </div>
      )}

      {/* Wallet tab */}
      {tab === 'wallet' && (
        <div>
          {walletLoading && (
            <p className="text-zinc-400 text-sm">Loading your Normies...</p>
          )}
          {!walletLoading && normieIds.length === 0 && (
            <p className="text-zinc-400 text-sm">No Normies found in this wallet.</p>
          )}
          {!walletLoading && normieIds.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {normieIds.map((id) => (
                <button
                  key={id}
                  onClick={() => { setTab('id'); setInput(id); fetchNormie(id) }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-zinc-300 text-sm hover:border-zinc-400 transition-colors"
                >
                  #{id}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}