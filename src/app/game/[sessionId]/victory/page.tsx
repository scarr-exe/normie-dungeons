'use client'

import { useRouter } from 'next/navigation'

export default function VictoryPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚔</p>
        <h1 className="text-white text-3xl font-bold mb-3">Dungeon Conquered</h1>
        <p className="text-zinc-400 text-sm mb-8">
          You defeated the dungeon and all who stood in your way. Your Normie's legend grows.
        </p>
        <button
          onClick={() => router.push('/lobby')}
          className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Enter Another Dungeon
        </button>
      </div>
    </main>
  )
}