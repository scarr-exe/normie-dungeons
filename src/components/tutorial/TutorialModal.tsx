'use client'

import { useState } from 'react'
import { NormieCharacter } from '@/types/normie'
import { motion, AnimatePresence } from 'framer-motion'

const C = {
  bg: '#0d0d0f', panel: '#13131a', panelMid: '#1a1a24',
  border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25',
  text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', red: '#dc2626',
  green: '#16a34a',
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  Warrior: 'High STR + CON. Tanks damage and hits hard in melee.',
  Rogue: 'High DEX + CHA. Strikes from the shadows with critical hits.',
  Mage: 'High INT + WIS. Commands powerful spells and crowd control.',
  Ranger: 'High DEX + WIS. Deadly at range with sharp perception.',
  Bard: 'High CHA + INT. Buffs allies and weakens enemies with wit.',
  Adventurer: 'Balanced stats. Adapts to any situation in the dungeon.',
}

const CLASS_COLORS: Record<string, string> = {
  Warrior: '#ef4444', Rogue: '#eab308', Mage: '#3b82f6',
  Ranger: '#22c55e', Bard: '#a855f7', Adventurer: '#9ca3af',
}

const STAT_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

const STAT_SOURCES: Record<string, string> = {
  str: 'Facial Feature', dex: 'Accessory', con: 'Age',
  int: 'Hair Style', wis: 'Eyes', cha: 'Expression',
}

const STAT_EFFECTS: Record<string, string> = {
  str: 'Melee damage', dex: 'Dodge & ranged', con: 'Max HP',
  int: 'Spell power', wis: 'Perception', cha: 'Persuasion',
}

const EXAMPLE_ACTIONS = [
  'I search for hidden traps',
  'I charge at the enemy',
  'I try to persuade the guard',
  'I cast a spell at the skeleton',
  'I sneak past the troll',
]

const ALL_CLASSES = ['Warrior', 'Rogue', 'Mage', 'Ranger', 'Bard', 'Adventurer']

function mod(val: number): string {
  const m = Math.floor((val - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
      <span style={{ fontSize: '9px', color: C.gold, letterSpacing: '0.2em', fontFamily: 'Cinzel, serif', whiteSpace: 'nowrap' }}>◆ {title} ◆</span>
      <div style={{ flex: 1, height: '1px', background: C.goldDim }} />
    </div>
  )
}

export function TutorialModal({ normie, onComplete }: { normie: NormieCharacter; onComplete: () => void }) {
  const [screen, setScreen] = useState(0)
  const [demoAction, setDemoAction] = useState('')
  const [demoResult, setDemoResult] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const totalScreens = 4

  async function runDemoAction() {
    if (!demoAction.trim()) return
    setDemoLoading(true)
    setDemoResult('')
    try {
      const res = await fetch('/api/claude/tutorial-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: demoAction, normie: { id: normie.id, characterClass: normie.characterClass, stats: normie.stats } }),
      })
      const data = await res.json()
      setDemoResult(data.narration)
    } catch {
      setDemoResult('The dungeon stirs in the darkness...')
    } finally {
      setDemoLoading(false)
    }
  }

  function handleComplete() {
    localStorage.setItem('tutorial_complete', 'true')
    onComplete()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px', fontFamily: "'IBM Plex Mono', monospace" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: C.panel, border: `1px solid ${C.goldDim}`, width: '100%', maxWidth: '560px', overflow: 'hidden' }}>

        {/* Progress bar */}
        <div style={{ height: '2px', background: C.border }}>
          <motion.div animate={{ width: `${((screen + 1) / totalScreens) * 100}%` }} transition={{ duration: 0.4 }}
            style={{ height: '100%', background: C.gold }} />
        </div>

        {/* Header */}
        <div style={{ background: '#1a1508', borderBottom: `1px solid ${C.goldDim}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '12px', color: C.gold, letterSpacing: '0.1em' }}>⚔ NORMIE DUNGEONS — TUTORIAL</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: totalScreens }).map((_, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i <= screen ? C.gold : C.border, transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          <AnimatePresence mode="wait">

            {/* Screen 0 — Welcome */}
            {screen === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <SectionDivider title="THE DUNGEON MASTER SPEAKS" />
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: C.text, marginBottom: '16px', letterSpacing: '0.05em' }}>
                  Welcome to Normie Dungeons
                </h2>
                <p style={{ fontSize: '13px', color: C.textDim, lineHeight: 1.8, marginBottom: '16px' }}>
                  You are about to enter a dungeon unlike any other. Your Normie NFT is your character — its traits define your stats, and your stats shape every outcome.
                </p>
                <p style={{ fontSize: '13px', color: C.textDim, lineHeight: 1.8, marginBottom: '20px' }}>
                  I am your Dungeon Master. I will describe every room, every enemy, and every consequence of your choices. No two runs are the same.
                </p>
                <div style={{ border: `1px solid ${C.border}`, background: C.panelMid }}>
                  {[
                    ['⚔', 'Solo mode', 'face the dungeon alone'],
                    ['⚔⚔', 'Party mode', 'up to 4 adventurers, one shared dungeon'],
                    ['↩', 'Sessions save', 'leave and return anytime'],
                  ].map(([icon, title, desc]) => (
                    <div key={title} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '14px', width: '20px' }}>{icon}</span>
                      <div>
                        <span style={{ fontSize: '12px', color: C.text, fontWeight: 600 }}>{title}</span>
                        <span style={{ fontSize: '12px', color: C.textDim }}> — {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Screen 1 — Traits + Stats */}
            {screen === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <SectionDivider title="YOUR CHARACTER" />
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', color: C.text, marginBottom: '8px' }}>How Traits Become Stats</h2>
                <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '20px', lineHeight: 1.7 }}>
                  Every trait on Normie #{normie.id} maps to a D&D ability score:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                  {Object.entries(normie.stats).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', background: C.panelMid, border: `1px solid ${C.border}`, padding: '8px 12px', gap: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, width: '28px' }}>{STAT_LABELS[key]}</span>
                      <span style={{ fontSize: '10px', color: C.textMuted, flex: 1 }}>← {STAT_SOURCES[key]}</span>
                      <span style={{ fontSize: '10px', color: C.textDim, flex: 1 }}>{STAT_EFFECTS[key]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: C.text, width: '24px', textAlign: 'right' }}>{val}</span>
                      <span style={{ fontSize: '10px', color: C.gold, width: '28px', textAlign: 'right' }}>{mod(val)}</span>
                    </div>
                  ))}
                </div>
                {normie.hasScarredPassive && (
                  <div style={{ border: `1px solid #c2410c`, background: '#1c0a00', padding: '12px 16px' }}>
                    <p style={{ fontSize: '10px', color: '#fb923c', letterSpacing: '0.1em', margin: '0 0 4px' }}>⚔ SCARRED PASSIVE UNLOCKED</p>
                    <p style={{ fontSize: '11px', color: C.textDim, margin: 0 }}>This Normie has been customized on-chain. You deal bonus damage on critical hits.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Screen 2 — Classes */}
            {screen === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <SectionDivider title="CHARACTER CLASSES" />
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', color: C.text, marginBottom: '4px' }}>Your Class: <span style={{ color: CLASS_COLORS[normie.characterClass] || C.textDim }}>{normie.characterClass}</span></h2>
                <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '16px' }}>{CLASS_DESCRIPTIONS[normie.characterClass]}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ALL_CLASSES.map(cls => (
                    <div key={cls} style={{
                      display: 'flex', gap: '12px', padding: '10px 14px',
                      background: cls === normie.characterClass ? C.panelMid : 'transparent',
                      border: `1px solid ${cls === normie.characterClass ? CLASS_COLORS[cls] || C.border : C.border}`,
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: CLASS_COLORS[cls] || C.textDim, width: '80px', flexShrink: 0 }}>{cls}</span>
                      <span style={{ fontSize: '11px', color: C.textMuted, lineHeight: 1.5 }}>{CLASS_DESCRIPTIONS[cls]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Screen 3 — First Turn */}
            {screen === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <SectionDivider title="YOUR FIRST TURN" />
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', color: C.text, marginBottom: '8px' }}>Try It Out</h2>
                <p style={{ fontSize: '12px', color: C.textDim, marginBottom: '16px', lineHeight: 1.7 }}>
                  Type any action below. The Dungeon Master will respond based on your {normie.characterClass}'s stats.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {EXAMPLE_ACTIONS.map(a => (
                    <button key={a} onClick={() => setDemoAction(a)}
                      style={{ fontSize: '10px', background: C.panelMid, border: `1px solid ${C.border}`, color: C.textDim, padding: '4px 10px', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}>
                      {a}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input type="text" placeholder="What do you do?" value={demoAction}
                    onChange={e => setDemoAction(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runDemoAction()}
                    style={{ flex: 1, background: C.panelMid, border: `1px solid ${C.border}`, color: C.text, padding: '10px 14px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }} />
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={runDemoAction} disabled={!demoAction.trim() || demoLoading}
                    style={{ background: !demoAction.trim() || demoLoading ? C.panelMid : C.gold, border: 'none', color: !demoAction.trim() || demoLoading ? C.textMuted : '#0d0d0f', padding: '10px 16px', cursor: !demoAction.trim() || demoLoading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
                    {demoLoading ? '...' : 'ACT'}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {demoResult && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ border: `1px solid ${C.goldDim}`, background: '#1a1508', padding: '16px' }}>
                      <p style={{ fontSize: '9px', color: C.gold, letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: 'Cinzel, serif' }}>◆ DUNGEON MASTER ◆</p>
                      <p style={{ fontSize: '12px', color: C.textDim, margin: 0, lineHeight: 1.8, fontStyle: 'italic' }}>{demoResult}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
            <button onClick={handleComplete}
              style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace" }}>
              Skip tutorial
            </button>
            {screen < totalScreens - 1 ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen(screen + 1)}
                style={{ background: C.gold, border: 'none', color: '#0d0d0f', padding: '10px 24px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
                NEXT →
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleComplete}
                style={{ background: C.gold, border: 'none', color: '#0d0d0f', padding: '10px 24px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>
                ENTER DUNGEON →
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}