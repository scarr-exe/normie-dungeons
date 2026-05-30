import { NextRequest, NextResponse } from 'next/server'
import { askDM } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { action, normie } = await req.json()

  const diceRoll = Math.floor(Math.random() * 20) + 1
  const relevantStat = getRelevantStat(action, normie.stats)
  const modifier = Math.floor((relevantStat.value - 10) / 2)
  const total = diceRoll + modifier

  const prompt = `You are a Dungeon Master narrating a tutorial for a new player in Normie Dungeons, a D&D-style dungeon crawler.

The player's character:
- Normie #${normie.id}
- Class: ${normie.characterClass}
- Stats: STR ${normie.stats.str}, DEX ${normie.stats.dex}, CON ${normie.stats.con}, INT ${normie.stats.int}, WIS ${normie.stats.wis}, CHA ${normie.stats.cha}

The player is in a tutorial room — a dimly lit stone chamber with a small chest in the corner and a sleeping goblin guard by the door.

Player action: "${action}"
Dice roll: ${diceRoll}/20 (using ${relevantStat.name} modifier: ${modifier >= 0 ? '+' : ''}${modifier}, total: ${total})

Write a 2-3 sentence narration resolving this action. Reference the dice roll result naturally. ${total >= 15 ? 'The action succeeds well.' : total >= 10 ? 'The action partially succeeds.' : 'The action fails or backfires slightly.'} Keep the tone dramatic but fun. Do not break character.`

try {
    const narration = await askDM(prompt, 200)
    return NextResponse.json({ narration, diceRoll, modifier, total, stat: relevantStat.name })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('DM error:', msg)
    return NextResponse.json({ narration: msg })
  }
}

function getRelevantStat(action: string, stats: Record<string, number>) {
  const lower = action.toLowerCase()

  if (lower.match(/attack|hit|strike|fight|charge|sword|axe/))
    return { name: 'STR', value: stats.str }
  if (lower.match(/sneak|dodge|run|hide|steal|pick|lock/))
    return { name: 'DEX', value: stats.dex }
  if (lower.match(/endure|resist|push|force|break/))
    return { name: 'CON', value: stats.con }
  if (lower.match(/spell|magic|cast|puzzle|read|decipher/))
    return { name: 'INT', value: stats.int }
  if (lower.match(/search|detect|notice|listen|trap|sense/))
    return { name: 'WIS', value: stats.wis }
  if (lower.match(/persuade|charm|talk|convince|intimidate|bluff/))
    return { name: 'CHA', value: stats.cha }

  return { name: 'WIS', value: stats.wis }
}