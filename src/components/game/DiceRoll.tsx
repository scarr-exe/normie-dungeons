'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DiceRollProps {
  roll: number
  modifier: number
  total: number
  stat: string
  onComplete: () => void
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export function DiceRoll({ roll, modifier, total, stat, onComplete }: DiceRollProps) {
  const [displayFace, setDisplayFace] = useState(DICE_FACES[0])
  const [phase, setPhase] = useState<'rolling' | 'result'>('rolling')

  const resultColor =
    total >= 15 ? 'text-green-400' :
    total >= 10 ? 'text-yellow-400' :
    'text-red-400'

  const resultLabel =
    total >= 18 ? 'Critical Success' :
    total >= 15 ? 'Success' :
    total >= 10 ? 'Partial Success' :
    total >= 6 ? 'Failure' :
    'Critical Failure'

  useEffect(() => {
    let count = 0
    const interval = setInterval(() => {
      setDisplayFace(DICE_FACES[Math.floor(Math.random() * 6)])
      count++
      if (count >= 12) {
        clearInterval(interval)
        setDisplayFace(DICE_FACES[Math.min(roll - 1, 5)])
        setPhase('result')
        setTimeout(onComplete, 2000)
      }
    }, 70)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 cursor-pointer"
        onClick={onComplete}
      >
        <motion.div
          initial={{ scale: 0.5, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 text-center"
        >
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-6">
            {stat} Check
          </p>

          <motion.div
            animate={phase === 'rolling' ? {
              rotate: [-8, 8, -8, 8, 0],
              scale: [1, 1.05, 1, 1.05, 1]
            } : { rotate: 0, scale: 1.1 }}
            transition={phase === 'rolling' ?
              { repeat: Infinity, duration: 0.3 } :
              { duration: 0.2 }
            }
            className="text-8xl mb-6 select-none"
          >
            {displayFace}
          </motion.div>

          <AnimatePresence>
            {phase === 'result' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-zinc-500 text-sm">
                    {roll}
                  </span>
                  {modifier !== 0 && (
                    <span className="text-zinc-500 text-sm">
                      {modifier > 0 ? '+' : ''}{modifier}
                    </span>
                  )}
                  <span className="text-zinc-600 text-sm">=</span>
                  <span className={`text-3xl font-bold ${resultColor}`}>
                    {total}
                  </span>
                </div>
                <p className={`text-sm font-semibold ${resultColor}`}>
                  {resultLabel}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-zinc-700 text-xs mt-6">click to skip</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}