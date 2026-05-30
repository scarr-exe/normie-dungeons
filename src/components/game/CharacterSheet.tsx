'use client'

import { NormieCharacter } from '@/types/normie'
import Image from 'next/image'

const CLASS_COLORS: Record<string, string> = {
  Warrior: 'text-red-400',
  Rogue: 'text-yellow-400',
  Mage: 'text-blue-400',
  Ranger: 'text-green-400',
  Bard: 'text-purple-400',
  Adventurer: 'text-zinc-400',
}

const STAT_LABELS: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
}

export function CharacterSheet({
  normie,
  onConfirm,
}: {
  normie: NormieCharacter
  onConfirm?: () => void
}) {
  const classColor = CLASS_COLORS[normie.characterClass] || 'text-zinc-400'

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
      {/* Portrait */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-600 bg-zinc-800 flex-shrink-0">
          <Image
            src={normie.imageUrl}
            alt={`Normie #${normie.id}`}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
            unoptimized
          />
        </div>
        <div>
          <p className="text-zinc-400 text-xs mb-1">Normie #{normie.id}</p>
          <p className={`text-lg font-bold ${classColor}`}>
            {normie.characterClass}
          </p>
          <p className="text-zinc-400 text-sm">
            HP: <span className="text-white font-semibold">{normie.maxHp}</span>
          </p>
          {normie.hasScarredPassive && (
            <span className="text-xs px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-800 rounded-full mt-1 inline-block">
              ⚔ Scarred
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {Object.entries(normie.stats).map(([key, value]) => (
          <div
            key={key}
            className="bg-zinc-800 rounded-lg p-2 text-center border border-zinc-700"
          >
            <p className="text-zinc-500 text-xs">{STAT_LABELS[key]}</p>
            <p className="text-white font-bold text-lg">{value}</p>
          </div>
        ))}
      </div>

      {/* Traits */}
      <div className="space-y-1 mb-6">
        {[
          ['Eyes', normie.traits.eyes],
          ['Expression', normie.traits.expression],
          ['Hair', normie.traits.hairStyle],
          ['Feature', normie.traits.facialFeature],
          ['Accessory', normie.traits.accessory],
        ].map(([label, value]) => (
          value !== 'None' && (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-300">{value}</span>
            </div>
          )
        ))}
      </div>

      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Play as Normie #{normie.id}
        </button>
      )}
    </div>
  )
}