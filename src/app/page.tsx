'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/hooks/useUser'
import { UsernameModal } from '@/components/ui/UsernameModal'
import { NormieSelector } from '@/components/game/NormieSelector'
import { TutorialModal } from '@/components/tutorial/TutorialModal'
import { NormieCharacter } from '@/types/normie'
import Image from 'next/image'

const C = { bg: '#0d0d0f', panel: '#13131a', border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25', text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', orange: '#e8642a' }

const SHOWCASE_NORMIES = ['1', '42', '100', '420', '999', '1337', '4200', '8888', '5555', '2077', '7777', '3333']
const FEATURES = [
  { title: 'EVERY RUN IS UNIQUE', desc: 'Thhe Dungeon Master narrates your adventure in real time, responding to every decision you make. No two dungeons are the same.' },
  { title: 'YOUR NORMIE IS YOUR CHARACTER', desc: "Eyes, expression, hair, accessories — every trait maps to a D&D stat. Your Normie's traits determine your class." },
  { title: 'MULTIPLE THEMES', desc: 'Fantasy dungeons, zombie apocalypses, sci-fi facilities, detective agencies — the Dungeon Master picks a theme and builds your world.' },
  { title: 'FACE IT ALONE OR WITH FRIENDS', desc: 'Solo runs or party dungeons with up to 4 adventurers. Share an invite code and explore the same dungeon together.' },
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
  Warrior: '#ef4444', Rogue: '#eab308', Mage: '#3b82f6',
  Ranger: '#22c55e', Bard: '#a855f7', Adventurer: '#9ca3af',
}

export default function LandingPage() {
  const { user, loading, refetch } = useUser()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [selectedNormie, setSelectedNormie] = useState<NormieCharacter | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialDone, setTutorialDone] = useState(false)
  const [normieImages, setNormieImages] = useState<string[]>([])
  const [normieClasses, setNormieClasses] = useState<Record<string, string>>({})
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem('tutorial_complete')
    if (done) setTutorialDone(true)
  }, [])

  useEffect(() => {
    const shuffled = [...SHOWCASE_NORMIES].sort(() => Math.random() - 0.5).slice(0, 12)
    setNormieImages(shuffled)
    shuffled.slice(0, 6).forEach(async (id) => {
      try {
        const res = await fetch(`https://api.normies.art/normie/${id}/metadata`)
        const data = await res.json()
        const attrs = data.attributes || []
        const get = (trait: string) => attrs.find((a: { trait_type: string; value: string }) => a.trait_type.toLowerCase() === trait.toLowerCase())?.value || 'None'
        const stats = { str: hashStat(get('Facial Feature')), dex: hashStat(get('Accessory')), con: hashStat(get('Age')), int: hashStat(get('Hair Style')), wis: hashStat(get('Eyes')), cha: hashStat(get('Expression')) }
        const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1])
        const top = sorted.slice(0, 2).map(([k]) => k)
        let cls = 'Adventurer'
        if (top.includes('str') && top.includes('con')) cls = 'Warrior'
        else if (top.includes('dex') && top.includes('cha')) cls = 'Rogue'
        else if (top.includes('int') && top.includes('wis')) cls = 'Mage'
        else if (top.includes('dex') && top.includes('wis')) cls = 'Ranger'
        else if (top.includes('cha') && top.includes('int')) cls = 'Bard'
        setNormieClasses(prev => ({ ...prev, [id]: cls }))
      } catch { setNormieClasses(prev => ({ ...prev, [id]: 'Adventurer' })) }
    })
  }, [])

  function handlePlay() {
    if (user) {
      if (tutorialDone) router.push('/lobby')
      else setShowModal(false) // will show normie selector below
    } else {
      setShowModal(true)
    }
  }

  function handleModalComplete() {
    refetch()
    setShowModal(false)
  }

  function handleNormieSelect(normie: NormieCharacter) {
    setSelectedNormie(normie)
    if (!tutorialDone) setShowTutorial(true)
    else router.push('/lobby')
  }

  function handleTutorialComplete() {
    localStorage.setItem('tutorial_complete', 'true')
    setTutorialDone(true)
    setShowTutorial(false)
    router.push('/lobby')
  }

  const btnOutline = { border: `1px solid ${C.orange}`, color: C.orange, background: 'transparent', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", transition: 'all 0.15s' }

  // If user exists but tutorial not done — show normie selector overlay
  if (user && !tutorialDone && !showTutorial) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace", display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', background: C.panel }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '14px', color: C.gold, letterSpacing: '0.1em' }}>⚔ NORMIE DUNGEONS</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <div style={{ flex: 1, height: '1px', background: C.goldDim, width: '120px' }} />
            <span style={{ fontSize: '10px', color: C.gold, letterSpacing: '0.25em', fontFamily: 'Cinzel, serif' }}>◆ CHOOSE YOUR CHAMPION ◆</span>
            <div style={{ flex: 1, height: '1px', background: C.goldDim, width: '120px' }} />
          </div>
          <NormieSelector onSelect={handleNormieSelect} />
        </div>
      </div>
    )
  }

  if (selectedNormie && showTutorial) {
    return <TutorialModal normie={selectedNormie} onComplete={handleTutorialComplete} />
  }

  return (
    <main style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.panel, position: 'relative', zIndex: 50 }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '13px', color: C.gold, letterSpacing: '0.1em' }}>⚔ NORMIE DUNGEONS</span>

        {/* Desktop Nav */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '24px' }}>
          <a href="https://normies.art" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: C.textMuted, textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Normies.art</a>
          <button onClick={handlePlay} style={{ ...btnOutline, padding: '8px 16px' }}>
            {loading ? '...' : user ? (tutorialDone ? 'Continue' : 'Play') : 'Play'}
          </button>
        </div>

        {/* Mobile Nav Hamburger */}
        <button
          className="md:hidden block"
          style={{ background: 'none', border: 'none', color: C.gold, fontSize: '24px', cursor: 'pointer', padding: '0 8px' }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile Nav Menu */}
      {isMenuOpen && (
        <div style={{ position: 'absolute', top: '53px', left: 0, right: 0, background: C.panel, borderBottom: `1px solid ${C.border}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 40, alignItems: 'center' }}>
          <a href="https://normies.art" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '12px', color: C.textDim, textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Normies.art</a>
          <button onClick={() => { setIsMenuOpen(false); handlePlay(); }} style={{ ...btnOutline, padding: '12px 32px', width: '100%', maxWidth: '200px' }}>
            {loading ? '...' : user ? (tutorialDone ? 'Continue' : 'Play') : 'Play'}
          </button>
        </div>
      )}

      {/* Hero */}
      <section style={{ position: 'relative', borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div className="hero-padding" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ fontSize: '13px', color: C.textMuted, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>Built on Normies</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '24px', lineHeight: 1.1, color: C.text }}>
            NORMIE<br />DUNGEONS
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ fontSize: '13px', color: C.textMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}></motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ fontSize: '15px', color: C.textDim, maxWidth: '400px', margin: '0 auto 48px', lineHeight: 1.7 }}>Your Normie is your character. Its traits become your stats. An AI Dungeon Master creates your world and narrates every move.</motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowModal(true)} style={{ ...btnOutline, padding: '16px 32px', fontSize: '12px', fontFamily: 'Cinzel, serif' }}>ENTER DUNGEON →</button>
            <a href="https://opensea.io/collection/normies" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: C.textMuted, textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Get a Normie ↗</a>
          </motion.div>
        </div>
        {/* background removed by user request */}
      </section>

      {/* What is it */}
      <section style={{ borderBottom: `1px solid ${C.border}`, padding: '80px 32px' }}>
        <div className="landing-grid-2" style={{ maxWidth: '900px', margin: '0 auto', gap: '64px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: C.text, marginBottom: '24px', lineHeight: 1.3 }}>YOUR NFT.<br />YOUR CHARACTER.</h2>
            <p style={{ fontSize: '15px', color: C.textDim, lineHeight: 1.8, marginBottom: '16px' }}>Normie Dungeons turns your on-chain NFT into a D&D character. Each Normie's traits map directly to stats like WIS, CHA, STR, and DEX.</p>
            <p style={{ fontSize: '15px', color: C.textDim, lineHeight: 1.8 }}>No Normie? Use any token ID. Holders get a verified badge.</p>
          </div>
          <div className="landing-grid-3-mobile" style={{ gap: '8px' }}>
            {normieImages.slice(0, 6).map((id, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                style={{ border: `1px solid ${C.border}`, background: C.panel, padding: '8px', aspectRatio: '1', position: 'relative' }}>
                <Image src={`https://api.normies.art/normie/${id}/image.png`} alt={`Normie #${id}`} width={120} height={120} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} unoptimized />
                {normieClasses[id] && (
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.85)', border: `1px solid ${CLASS_COLORS[normieClasses[id]] || C.border}`, color: CLASS_COLORS[normieClasses[id]] || C.textMuted, fontSize: '8px', fontFamily: "'IBM Plex Mono', monospace", padding: '2px 5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
          <p style={{ fontSize: '11px', color: C.orange, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '48px', textAlign: 'center' }}>FEATURES</p>
          <div className="landing-grid-2" style={{ gap: '1px', background: C.border }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: C.bg, padding: '32px' }}>
                <p style={{ fontSize: '12px', color: C.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>{f.label}</p>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '16px', color: C.text, marginBottom: '12px', lineHeight: 1.4 }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: C.textDim, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderBottom: `1px solid ${C.border}`, padding: '48px 32px' }}>
        <div className="landing-grid-3" style={{ maxWidth: '900px', margin: '0 auto', gap: '1px', background: C.border }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: C.bg, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '32px', color: C.text, marginBottom: '8px' }}>{s.num}</p>
              <p style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.15em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '128px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: C.textMuted, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>Ready to play?</p>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(32px, 5vw, 56px)', color: C.text, marginBottom: '40px', lineHeight: 1.1 }}>ENTER THE<br />DUNGEON</h2>
        <button onClick={() => setShowModal(true)} style={{ ...btnOutline, padding: '20px 40px', fontSize: '12px', fontFamily: 'Cinzel, serif' }}>PLAY NOW →</button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '11px', color: C.textMuted }}>NORMIE DUNGEONS</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: C.textMuted }}>2026 Normie Dungeons</span>
        </div>
      </footer>

      {showModal && <UsernameModal onComplete={handleModalComplete} />}
    </main>
  )
}