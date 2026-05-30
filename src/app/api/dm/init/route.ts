import { NextRequest, NextResponse } from 'next/server'
import { askDM } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { players, mode } = await req.json()

  const partyText = players.map((p: {
    username: string
    characterClass: string
    normieId: string
    stats: Record<string, number>
    hasScarredPassive: boolean
  }) =>
    `- ${p.username}: Normie #${p.normieId}, ${p.characterClass}${p.hasScarredPassive ? ' (Scarred)' : ''}`
  ).join('\n')

  const prompt = `You are the Dungeon Master of Normie Dungeons, a D&D-style dungeon crawler built on Normie NFTs.

Generate an opening for a ${mode === 'solo' ? 'solo' : 'party'} dungeon run.

${mode === 'party' ? `PARTY:\n${partyText}` : `ADVENTURER:\n${partyText}`}

Respond in this exact JSON format:
{
  "dungeonName": "A short dramatic dungeon name (4-6 words)",
  "opening": "A 3-4 sentence atmospheric opening scene. Set the mood, describe the entrance, hint at what lurks inside. Address the player(s) by username."
}

Make it feel like classic D&D — dark, atmospheric, a little dangerous. Do NOT break character.`

  try {
    const raw = await askDM(prompt, 300)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    console.error('DM init error:', error)
    return NextResponse.json({
      dungeonName: 'The Forgotten Depths',
      opening: 'You stand before a crumbling stone archway, torch flickering in the stale underground air. The dungeon breathes with an ancient malice, its darkness thick and impenetrable beyond the first corridor. Whatever lies ahead has waited a long time for someone foolish enough to enter.',
    })
  }
}