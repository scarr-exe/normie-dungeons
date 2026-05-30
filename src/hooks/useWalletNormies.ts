'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

const BASE_URL = process.env.NEXT_PUBLIC_NORMIES_API_BASE || 'https://api.normies.art'

export function useWalletNormies() {
  const [normieIds, setNormieIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    if (!isConnected || !address) {
      setNormieIds([])
      return
    }
    fetchWalletNormies(address)
  }, [address, isConnected])

  async function fetchWalletNormies(address: string) {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/holders/${address}`)
      if (!res.ok) return
      const data = await res.json()
      const ids = Array.isArray(data)
        ? data.map((n: { id?: string; tokenId?: string | number }) =>
            String(n.id || n.tokenId || '')
          ).filter(Boolean)
        : []
      setNormieIds(ids)
    } catch {
      setNormieIds([])
    } finally {
      setLoading(false)
    }
  }

  return { normieIds, loading }
}