import { NextRequest, NextResponse } from 'next/server'
import { askDM } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { action, player, allPlayers, dungeonName, roomNumber, totalRooms, messageHistory } = await req.json()

  const diceRoll = Math.floor(Math.random() * 20) + 1
  const modifier = getModifier(action, player.stats)
  const total = diceRoll + modifier.value

  const isLastRoom = roomNumber >= totalRooms
  const historyText = messageHistory
    .slice(-6)
    .map((m: { type: string; content: string; username?: string }) =>
      m.type === 'player_action'
        ? `${m.username}: ${m.content}`
        : `DM: ${m.content}`
    )
    .join('\n')

  const prompt = `You are the Dungeon Master of Normie Dungeons, a D&D-style dungeon crawler.

DUNGEON: ${dungeonName}
ROOM: ${roomNumber} of ${totalRooms}${isLastRoom ? ' (BOSS ROOM)' : ''}

ACTIVE PLAYER:
- ${player.username} playing Normie #${player.normieId}
- Class: ${player.characterClass}
- HP: ${player.hp}/${player.maxHp}
- Stats: STR ${player.stats.str}, DEX ${player.stats.dex}, CON ${player.stats.con}, INT ${player.stats.int}, WIS ${player.stats.wis}, CHA ${player.stats.cha}
${player.hasScarredPassive ? '- Passive: Scarred (bonus damage on crits)' : ''}

${allPlayers.length > 1 ? `PARTY:\n${allPlayers.filter((p: { userId: string }) => p.userId !== player.userId).map((p: { username: string; characterClass: string; hp: number; maxHp: number }) => `- ${p.username} (${p.characterClass}) HP: ${p.hp}/${p.maxHp}`).join('\n')}` : ''}

RECENT EVENTS:
${historyText || 'The dungeon run just began.'}

PLAYER ACTION: "${action}"
DICE ROLL: ${diceRoll}/20 (${modifier.stat} modifier: ${modifier.value >= 0 ? '+' : ''}${modifier.value}, total: ${total})

${isLastRoom ? 'This is the BOSS ROOM. Make the encounter epic and high-stakes.' : ''}
${total >= 18 ? 'Critical success — exceptional outcome.' : total >= 15 ? 'Strong success.' : total >= 10 ? 'Partial success with complications.' : total >= 6 ? 'Failure with consequences.' : 'Critical failure — something goes wrong.'}

Respond in this exact JSON format:
{
  "narration": "2-3 sentences narrating the action outcome. Reference the dice roll naturally.",
  "hpChange": 0,
  "roomCleared": false,
  "playerDefeated": false,
  "partyDefeated": false,
  "dungeonComplete": false
}

Rules:
- hpChange is negative for damage, positive for healing (max -8 to +5)
- roomCleared: true only if the current threat is fully resolved
- playerDefeated: true only if hp would drop to 0
- dungeonComplete: true only if this is the boss room AND roomCleared is true
- Keep narration dramatic, specific, and under 80 words
- Do NOT break character or mention JSON`

  try {
    const raw = await askDM(prompt, 400)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      narration: result.narration,
      hpChange: result.hpChange || 0,
      roomCleared: result.roomCleared || false,
      playerDefeated: result.playerDefeated || false,
      dungeonComplete: result.dungeonComplete || false,
      diceRoll,
      modifier: modifier.value,
      total,
      stat: modifier.stat,
    })
  } catch (error) {
    console.error('DM turn error:', error)
    return NextResponse.json({
      narration: 'The dungeon shifts around you, momentarily disorienting...',
      hpChange: 0,
      roomCleared: false,
      playerDefeated: false,
      dungeonComplete: false,
      diceRoll,
      modifier: modifier.value,
      total,
      stat: modifier.stat,
    })
  }
}

function getModifier(action: string, stats: Record<string, number>) {
  const lower = action.toLowerCase()
  if (lower.match(/attack|hit|strike|fight|charge|sword|axe|stab/))
    return { stat: 'STR', value: Math.floor((stats.str - 10) / 2) }
  if (lower.match(/sneak|dodge|run|hide|steal|pick|lock|dash/))
    return { stat: 'DEX', value: Math.floor((stats.dex - 10) / 2) }
  if (lower.match(/endure|resist|push|force|break|tank/))
    return { stat: 'CON', value: Math.floor((stats.con - 10) / 2) }
  if (lower.match(/spell|magic|cast|puzzle|read|decipher|analyze/))
    return { stat: 'INT', value: Math.floor((stats.int - 10) / 2) }
  if (lower.match(/search|detect|notice|listen|trap|sense|scout/))
    return { stat: 'WIS', value: Math.floor((stats.wis - 10) / 2) }
  if (lower.match(/persuade|charm|talk|convince|intimidate|bluff|negotiate/))
    return { stat: 'CHA', value: Math.floor((stats.cha - 10) / 2) }
  return { stat: 'WIS', value: Math.floor((stats.wis - 10) / 2) }
}