'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { UsernameModal } from '@/components/ui/UsernameModal'
import { NormieSelector } from '@/components/game/NormieSelector'
import { TutorialModal } from '@/components/tutorial/TutorialModal'
import { NormieCharacter } from '@/types/normie'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, loading, refetch } = useUser()
  const [selectedNormie, setSelectedNormie] = useState<NormieCharacter | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialDone, setTutorialDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const done = localStorage.getItem('tutorial_complete')
    if (done) setTutorialDone(true)
  }, [])

  function handleNormieSelect(normie: NormieCharacter) {
    setSelectedNormie(normie)
    if (!tutorialDone) {
      setShowTutorial(true)
    } else {
      router.push('/lobby')
    }
  }

  function handleTutorialComplete() {
    localStorage.setItem('tutorial_complete', 'true')
    setTutorialDone(true)
    setShowTutorial(false)
    router.push('/lobby')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {!user && <UsernameModal onComplete={refetch} />}

      {user && !selectedNormie && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-center mb-4">
            <p className="text-white font-semibold">{user.username}</p>
            <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
              {user.badge === 'verified' ? '✓ Verified Holder' : 'Adventurer'}
            </span>
          </div>
          <NormieSelector onSelect={handleNormieSelect} />
        </div>
      )}

      {selectedNormie && showTutorial && (
        <TutorialModal
          normie={selectedNormie}
          onComplete={handleTutorialComplete}
        />
      )}
    </main>
  )
}