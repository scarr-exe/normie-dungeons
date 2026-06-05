'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const C = { bg: '#0d0d0f', panel: '#13131a', border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25', text: '#e8e0d0', textDim: '#a09080', red: '#7f1d1d' }

export default function DefeatPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ border: `1px solid ${C.red}`, background: '#1a0808', padding: '32px', marginBottom: '16px' }}>
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} style={{ fontSize: '48px', margin: '0 0 16px' }}>💀</motion.p>
          <p style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '0.3em', marginBottom: '8px' }}>YOU HAVE FALLEN</p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: C.text, margin: '0 0 12px' }}>THE DUNGEON CLAIMS ANOTHER SOUL</h1>
          <p style={{ fontSize: '12px', color: C.textDim, lineHeight: 1.7, margin: 0 }}>Your Normie's story ends here — for now. The dungeon remembers those who dared to enter.</p>
        </div>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push('/lobby')}
          style={{ width: '100%', background: C.gold, border: 'none', color: '#0d0d0f', padding: '14px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>
          RISE AGAIN →
        </motion.button>
      </motion.div>
    </div>
  )
}