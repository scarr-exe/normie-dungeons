'use client'

import { useState } from 'react'
import { buildNormieCharacter } from '@/lib/normies'
import { NormieCharacter } from '@/types/normie'

export function useNormie() {
  const [normie, setNormie] = useState<NormieCharacter | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchNormie(id: string) {
    setLoading(true)
    setError('')
    setNormie(null)

    try {
      const character = await buildNormieCharacter(id)
      setNormie(character)
    } catch {
      setError(`Normie #${id} not found. Check the ID and try again.`)
    } finally {
      setLoading(false)
    }
  }

  return { normie, loading, error, fetchNormie }
}