'use client'

import { NormieCharacter } from '@/types/normie'
import Image from 'next/image'
import { motion } from 'framer-motion'

const C = {
  bg: '#0d0d0f', panel: '#13131a', panelMid: '#1a1a24',
  border: '#252535', gold: '#c8a85c', goldDim: '#4a3f25',
  text: '#e8e0d0', textDim: '#a09080', textMuted: '#504840', red: '#dc2626',
}

const CLASS_COLORS: Record<string, string> = {
  Warrior: '#ef4444', Rogue: '#eab308', Mage: '#3b82f6',
  Ranger: '#22c55e', Bard: '#a855f7', Adventurer: '#9ca3af',
}

const STAT_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

function mod(val: number): string {
  const m = Math.floor((val - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

export function CharacterSheet({ normie, onConfirm }: { normie: NormieCharacter; onConfirm?: () => void }) {
  const classColor = CLASS_COLORS[normie.characterClass] || C.textDim

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: C.panel, border: `1px solid ${C.goldDim}`, fontFamily: "'IBM Plex Mono', monospace", width: '100%' }}>

      {/* Header strip */}
      <div style={{ background: '#1a1508', borderBottom: `1px solid ${C.goldDim}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Image src={normie.imageUrl} alt={`Normie #${normie.id}`} width={56} height={56}
            style={{ imageRendering: 'pixelated', display: 'block', border: `1px solid ${C.goldDim}` }} unoptimized />
          {normie.hasScarredPassive && (
            <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: '#7c2d12', border: `1px solid #c2410c`, color: '#fb923c', fontSize: '7px', padding: '1px 5px', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
              SCARRED
            </div>
          )}
        </div>
        <div>
          <p style={{ fontSize: '10px', color: C.textMuted, letterSpacing: '0.15em', margin: '0 0 4px' }}>NORMIE #{normie.id}</p>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: classColor, margin: '0 0 2px', fontWeight: 700 }}>{normie.characterClass}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: C.red }}>♥</span>
            <span style={{ fontSize: '11px', color: C.textDim }}>HP: <span style={{ color: C.text, fontWeight: 600 }}>{normie.maxHp}</span></span>
          </div>
        </div>
      </div>

      {/* Stat block */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '8px', color: C.textMuted, letterSpacing: '0.2em', marginBottom: '10px' }}>ABILITY SCORES</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {Object.entries(normie.stats).map(([key, value]) => (
            <div key={key} style={{ background: C.panelMid, border: `1px solid ${C.border}`, padding: '8px 4px', textAlign: 'center' }}>
              <p style={{ fontSize: '8px', color: C.textMuted, letterSpacing: '0.15em', margin: '0 0 4px' }}>{STAT_LABELS[key]}</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '10px', color: C.gold, margin: 0 }}>{mod(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Traits */}
      <div style={{ padding: '16px 20px', borderBottom: onConfirm ? `1px solid ${C.border}` : 'none' }}>
        <p style={{ fontSize: '8px', color: C.textMuted, letterSpacing: '0.2em', marginBottom: '10px' }}>TRAITS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            ['Eyes', normie.traits.eyes],
            ['Expression', normie.traits.expression],
            ['Hair', normie.traits.hairStyle],
            ['Feature', normie.traits.facialFeature],
            ['Accessory', normie.traits.accessory],
          ].filter(([, v]) => v && v !== 'None').map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '11px', color: C.textMuted }}>{label}</span>
              <span style={{ fontSize: '11px', color: C.textDim }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm button */}
      {onConfirm && (
        <div style={{ padding: '16px 20px' }}>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={onConfirm}
            style={{ width: '100%', background: C.gold, border: 'none', color: '#0d0d0f', padding: '14px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>
            PLAY AS NORMIE #{normie.id} →
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}