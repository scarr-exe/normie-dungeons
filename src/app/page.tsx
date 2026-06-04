'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/hooks/useUser'
import { UsernameModal } from '@/components/ui/UsernameModal'
import Image from 'next/image'

const C = {
  bg: '#0a0a0a',
  surface: '#141414',
  border: '#222222',
  text: '#e8e8e8',
  muted: '#666666',
  orange: '#e8642a',
}

const SHOWCASE_NORMIES = ['1', '42', '100', '420', '999', '1337', '4200', '8888', '5555', '2077', '7777', '3333']

const FEATURES = [
  { label: 'AI DUNGEON MASTER', title: 'Every run is unique', desc: 'An AI narrates your adventure in real time, responding to every decision you make. No two dungeons are the same.' },
  { label: 'TRAIT-BASED STATS', title: 'Your Normie is your character', desc: "Eyes, expression, hair, accessories — every trait maps to a D&D stat. Your Normie's traits determine your class." },
  { label: '30+ DUNGEON THEMES', title: 'From crypts to space stations', desc: 'Fantasy dungeons, zombie apocalypses, sci-fi facilities, detective agencies — the AI picks a theme and builds your world.' },
  { label: 'SOLO & PARTY MODE', title: 'Face it alone or with friends', desc: 'Solo runs or party dungeons with up to 4 adventurers. Share an invite code and explore the same dungeon together.' },
]

const STEPS = [
  { num: '01', title: 'ENTER YOUR NORMIE', desc: 'Connect your wallet or enter any Normie ID. Your traits become your stats.' },
  { num: '02', title: 'ENTER THE DUNGEON', desc: 'The AI generates a unique dungeon — name, setting, atmosphere — just for your run.' },
  { num: '03', title: 'MAKE YOUR MOVE', desc: 'Type any action. Dice roll. The Dungeon Master narrates the outcome. Survive to the boss.' },
]

const STATS = [
  { num: '10,000', label: 'PLAYABLE NORMIES' },
  { num: '30+', label: 'DUNGEON THEMES' },
  { num: '6', label: 'CHARACTER CLASSES' },
]

function hashStat(str: string): number {
  const val = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return 8 + (val % 11)
}

const CLASS_COLORS: Record<string, string> = {
  Warrior: '#ef4444',
  Rogue: '#eab308',
  Mage: '#3b82f6',
  Ranger: '#22c55e',
  Bard: '#a855f7',
  Adventurer: '#9ca3af',
}

export default function LandingPage() {
  const { user, loading, refetch } = useUser()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [normieImages, setNormieImages] = useState<string[]>([])
  const [normieClasses, setNormieClasses] = useState<Record<string, string>>({})

  useEffect(() => {
    const shuffled = [...SHOWCASE_NORMIES].sort(() => Math.random() - 0.5).slice(0, 8)
    setNormieImages(shuffled)

    // Fetch classes for the 6 shown in the grid
    const gridIds = shuffled.slice(0, 6)
    gridIds.forEach(async (id) => {
      try {
        const res = await fetch(`https://api.normies.art/normie/${id}/metadata`)
        const data = await res.json()
        const attrs = data.attributes || []
        const get = (trait: string) => attrs.find((a: { trait_type: string; value: string }) =>
          a.trait_type.toLowerCase() === trait.toLowerCase())?.value || 'None'

        const stats = {
          str: hashStat(get('Facial Feature')),
          dex: hashStat(get('Accessory')),
          con: hashStat(get('Age')),
          int: hashStat(get('Hair Style')),
          wis: hashStat(get('Eyes')),
          cha: hashStat(get('Expression')),
        }

        const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1])
        const top = sorted.slice(0, 2).map(([k]) => k)
        let cls = 'Adventurer'
        if (top.includes('str') && top.includes('con')) cls = 'Warrior'
        else if (top.includes('dex') && top.includes('cha')) cls = 'Rogue'
        else if (top.includes('int') && top.includes('wis')) cls = 'Mage'
        else if (top.includes('dex') && top.includes('wis')) cls = 'Ranger'
        else if (top.includes('cha') && top.includes('int')) cls = 'Bard'

        setNormieClasses(prev => ({ ...prev, [id]: cls }))
      } catch {
        setNormieClasses(prev => ({ ...prev, [id]: 'Adventurer' }))
      }
    })
  }, [])

  function handlePlay() {
    if (user) router.push('/lobby')
    else setShowModal(true)
  }

  function handleModalComplete() {
    refetch()
    setShowModal(false)
    router.push('/lobby')
  }

  const btnOutline = {
    border: `1px solid ${C.orange}`,
    color: C.orange,
    background: 'transparent',
    cursor: 'pointer',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    fontSize: '11px',
    fontFamily: 'monospace',
    transition: 'all 0.15s',
  }

  return (
    <main style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'monospace' }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', letterSpacing: '0.1em', fontWeight: 700 }}>NORMIE DUNGEONS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="https://normies.art" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '11px', color: C.muted, textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Normies.art
          </a>
          <button onClick={handlePlay} style={{ ...btnOutline, padding: '8px 16px' }}>
            {loading ? '...' : user ? 'Continue' : 'Play'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '128px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ fontSize: '13px', color: C.muted, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>
            Built on Normies · Powered by AI
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '24px', lineHeight: 1.1 }}>
            NORMIE<br />DUNGEONS
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ fontSize: '13px', color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            D&amp;D-STYLE DUNGEON CRAWLER FOR NORMIE NFT HOLDERS
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: '16px', color: C.muted, maxWidth: '400px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Your Normie is your character. Its traits become your stats.
            An AI Dungeon Master generates your world and narrates every move.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handlePlay} style={{ ...btnOutline, padding: '16px 32px', fontSize: '12px' }}>
              ENTER DUNGEON →
            </button>
            <a href="https://opensea.io/collection/normies" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: C.muted, textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Get a Normie ↗
            </a>
          </motion.div>
        </div>

        {/* Normie grid background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.08 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', height: '100%' }}>
            {normieImages.map((id, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                <Image src={`https://api.normies.art/normie/${id}/image.png`} alt="" fill
                  style={{ objectFit: 'cover', imageRendering: 'pixelated' }} unoptimized />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is it */}
      <section style={{ borderBottom: `1px solid ${C.border}`, padding: '80px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: C.orange, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
              WHAT IS NORMIE DUNGEONS?
            </p>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', lineHeight: 1.3 }}>
              YOUR NFT.<br />YOUR CHARACTER.
            </h2>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.8, marginBottom: '16px' }}>
              Normie Dungeons turns your on-chain NFT into a D&D character.
              Each Normie's traits map directly to stats like WIS, CHA, STR, and DEX.
            </p>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.8 }}>
              No Normie? Use any token ID. Holders get a verified badge.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {normieImages.slice(0, 6).map((id, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{ border: `1px solid ${C.border}`, background: C.surface, padding: '8px', aspectRatio: '1', position: 'relative' }}>
                <Image src={`https://api.normies.art/normie/${id}/image.png`} alt={`Normie #${id}`}
                  width={120} height={120}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} unoptimized />
                {normieClasses[id] && (
                  <div style={{
                    position: 'absolute', bottom: '12px', left: '12px',
                    background: 'rgba(0,0,0,0.85)',
                    border: `1px solid ${CLASS_COLORS[normieClasses[id]] || C.border}`,
                    color: CLASS_COLORS[normieClasses[id]] || C.muted,
                    fontSize: '9px', fontFamily: 'monospace',
                    padding: '2px 6px', letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    {normieClasses[id]}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderBottom: `1px solid ${C.border}`, padding: '80px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '19px', color: C.orange, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '48px', textAlign: 'center' }}>
            FEATURES
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.border }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: C.bg, padding: '32px' }}>
                <p style={{ fontSize: '12px', color: C.muted, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>{f.label}</p>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>{f.title}</h3>
                <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderBottom: `1px solid ${C.border}`, padding: '80px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '19px', color: C.orange, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '48px', textAlign: 'center' }}>
            HOW IT WORKS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: C.border }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: C.bg, padding: '32px' }}>
                <p style={{ fontSize: '32px', fontWeight: 700, color: C.border, marginBottom: '16px' }}>{s.num}</p>
                <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderBottom: `1px solid ${C.border}`, padding: '48px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: C.border }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: C.bg, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>{s.num}</p>
              <p style={{ fontSize: '10px', color: C.muted, letterSpacing: '0.15em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '128px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>
          Ready to play?
        </p>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, marginBottom: '40px', lineHeight: 1.1 }}>
          ENTER THE<br />DUNGEON
        </h2>
        <button onClick={handlePlay} style={{ ...btnOutline, padding: '20px 40px', fontSize: '12px' }}>
          PLAY NOW →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: C.muted }}>NORMIE DUNGEONS</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="https://normies.art" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '11px', color: C.muted, textDecoration: 'none' }}>
            Built on Normies
          </a>
          <span style={{ fontSize: '11px', color: C.muted }}>© 2023 Normie Dungeons. All rights reserved.</span>
        </div>
      </footer>

      {showModal && <UsernameModal onComplete={handleModalComplete} />}
    </main>
  )
}