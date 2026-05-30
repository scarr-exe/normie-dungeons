'use client'

import { useState } from 'react'
import { NormieCharacter } from '@/types/normie'
import { CharacterSheet } from '@/components/game/CharacterSheet'
import { motion, AnimatePresence } from 'framer-motion'

const CLASS_DESCRIPTIONS: Record<string, string> = {
  Warrior: 'High STR + CON. Tanks damage and hits hard in melee.',
  Rogue: 'High DEX + CHA. Strikes from the shadows with critical hits.',
  Mage: 'High INT + WIS. Commands powerful spells and crowd control.',
  Ranger: 'High DEX + WIS. Deadly at range with sharp perception.',
  Bard: 'High CHA + INT. Buffs allies and weakens enemies with wit.',
  Adventurer: 'Balanced stats. Adapts to any situation.',
}

const STAT_EXPLANATIONS = [
  { stat: 'STR', source: 'Facial Feature', effect: 'Melee attack damage' },
  { stat: 'DEX', source: 'Accessory', effect: 'Dodge chance + ranged attacks' },
  { stat: 'CON', source: 'Age', effect: 'Max HP + endurance' },
  { stat: 'INT', source: 'Hair Style', effect: 'Spell power + puzzles' },
  { stat: 'WIS', source: 'Eyes', effect: 'Perception + trap detection' },
  { stat: 'CHA', source: 'Expression', effect: 'Persuasion + NPC interactions' },
]

const EXAMPLE_ACTIONS = [
  'I search the room for hidden traps',
  'I charge at the goblin with my sword',
  'I try to persuade the guard to let us pass',
  'I cast a spell at the skeleton',
  'I sneak past the sleeping troll',
]

export function TutorialModal({
  normie,
  onComplete,
}: {
  normie: NormieCharacter
  onComplete: () => void
}) {
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
        body: JSON.stringify({
          action: demoAction,
          normie: {
            id: normie.id,
            characterClass: normie.characterClass,
            stats: normie.stats,
          },
        }),
      })
      const data = await res.json()
      setDemoResult(data.narration)
    } catch {
      setDemoResult('The dungeon stirs... (failed to connect to the DM)')
    } finally {
      setDemoLoading(false)
    }
  }

  function handleSkip() {
    localStorage.setItem('tutorial_complete', 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="w-full h-1 bg-zinc-800">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${((screen + 1) / totalScreens) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* Screen 0 — Welcome */}
            {screen === 0 && (
              <motion.div
                key="screen0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">
                  The Dungeon Master speaks
                </p>
                <h2 className="text-white text-2xl font-bold mb-4">
                  Welcome to Normie Dungeons
                </h2>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  You are about to enter a dungeon unlike any other. Your Normie NFT is your character — its traits define your stats, and your stats shape every outcome.
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  I am your Dungeon Master. I will describe every room, every enemy, and every consequence of your choices. No two runs are the same.
                </p>
                <div className="bg-zinc-800 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-zinc-400">
                    <span className="text-white font-medium">Solo mode</span> — face the dungeon alone
                  </p>
                  <p className="text-zinc-400">
                    <span className="text-white font-medium">Party mode</span> — up to 4 adventurers, one shared dungeon
                  </p>
                  <p className="text-zinc-400">
                    <span className="text-white font-medium">Sessions save</span> — leave and return anytime
                  </p>
                </div>
              </motion.div>
            )}

            {/* Screen 1 — Traits + Stats */}
            {screen === 1 && (
              <motion.div
                key="screen1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">
                  Your character
                </p>
                <h2 className="text-white text-2xl font-bold mb-4">
                  How Traits Become Stats
                </h2>
                <p className="text-zinc-300 text-sm mb-4">
                  Every trait on your Normie maps to a D&D stat. Here's how Normie #{normie.id} breaks down:
                </p>
                <div className="space-y-2 mb-4">
                  {STAT_EXPLANATIONS.map(({ stat, source, effect }) => (
                    <div
                      key={stat}
                      className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold w-8">{stat}</span>
                        <span className="text-zinc-500 text-xs">← {source}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 text-xs">{effect}</span>
                        <span className="text-white font-bold">
                          {normie.stats[stat.toLowerCase() as keyof typeof normie.stats]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {normie.hasScarredPassive && (
                  <div className="bg-orange-950 border border-orange-800 rounded-lg p-3 text-sm">
                    <span className="text-orange-400 font-medium">⚔ Scarred Passive unlocked</span>
                    <p className="text-orange-300 text-xs mt-1">
                      This Normie has been customized on-chain. You deal bonus damage on critical hits.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Screen 2 — Character Classes */}
            {screen === 2 && (
              <motion.div
                key="screen2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">
                  Character classes
                </p>
                <h2 className="text-white text-2xl font-bold mb-2">
                  Your Class: {normie.characterClass}
                </h2>
                <p className="text-zinc-300 text-sm mb-4">
                  {CLASS_DESCRIPTIONS[normie.characterClass]}
                </p>
                <div className="space-y-2">
                  {Object.entries(CLASS_DESCRIPTIONS).map(([cls, desc]) => (
                    <div
                      key={cls}
                      className={`flex gap-3 rounded-lg px-3 py-2 text-sm border transition-colors ${
                        cls === normie.characterClass
                          ? 'bg-zinc-700 border-zinc-500'
                          : 'bg-zinc-800 border-transparent'
                      }`}
                    >
                      <span className="text-white font-medium w-24 flex-shrink-0">{cls}</span>
                      <span className="text-zinc-400 text-xs">{desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Screen 3 — Your First Turn */}
            {screen === 3 && (
              <motion.div
                key="screen3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">
                  Try it out
                </p>
                <h2 className="text-white text-2xl font-bold mb-2">
                  Your First Turn
                </h2>
                <p className="text-zinc-300 text-sm mb-4">
                  Type any action below. The Dungeon Master will respond based on your stats.
                </p>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {EXAMPLE_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => setDemoAction(action)}
                      className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="What do you do?"
                    value={demoAction}
                    onChange={(e) => setDemoAction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runDemoAction()}
                    className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400"
                  />
                  <button
                    onClick={runDemoAction}
                    disabled={!demoAction.trim() || demoLoading}
                    className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-40 text-sm transition-colors"
                  >
                    {demoLoading ? '...' : 'Act'}
                  </button>
                </div>

                {demoResult && (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed">
                    <p className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">
                      Dungeon Master
                    </p>
                    {demoResult}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handleSkip}
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              Skip tutorial
            </button>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: totalScreens }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === screen ? 'bg-white' : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
              {screen < totalScreens - 1 ? (
                <button
                  onClick={() => setScreen(screen + 1)}
                  className="bg-white text-black font-semibold px-5 py-2 rounded-lg hover:bg-zinc-200 text-sm transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="bg-white text-black font-semibold px-5 py-2 rounded-lg hover:bg-zinc-200 text-sm transition-colors"
                >
                  Enter Dungeon
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}