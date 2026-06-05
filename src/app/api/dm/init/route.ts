import { NextRequest, NextResponse } from 'next/server'
import { askDM } from '@/lib/ai'

const DUNGEON_THEMES = [
  'a submerged underwater temple with air pockets and sea creatures',
  'a volcanic forge dungeon with rivers of lava and fire elementals',
  'a haunted library where books come alive and shadows read your mind',
  'a floating sky fortress above the clouds with wind-based traps',
  'a frozen tundra dungeon where the cold itself is the enemy',
  'an ancient Egyptian tomb filled with mummies and cursed artifacts',
  'an abandoned clockwork factory with mechanical guardians',
  'a cursed swamp dungeon where the ground itself tries to swallow you',
  'a giant mushroom forest labyrinth with spores that cause hallucinations',
  'a crystal cave dungeon where reflections come to life',
  'a pirate cove dungeon beneath the ocean floor',
  'a jungle temple overrun by nature with beast guardians',
  'a nightmare realm where the dungeon shifts and warps as you move',
  'a ruined dwarven mine with cave-ins and ancient mining machines',
  'a demon circus with twisted performers and deadly acts',
  'a dragon graveyard where undead dragon bones patrol the corridors',
  'an abandoned space station overrun by alien organisms',
  'a cyberpunk underground server farm guarded by rogue AI drones',
  'a crashed alien spacecraft with malfunctioning technology and strange lifeforms',
  'a time-fractured dungeon where past and future versions of rooms overlap',
  'a neon-lit underground city ruled by a rogue synthetic intelligence',
  'a bio-mechanical dungeon where the walls are alive and made of circuitry and flesh',
  'a zero-gravity asteroid mine with malfunctioning robots and vacuum traps',
  'a cloning facility gone wrong with hostile copies of previous adventurers',
  'a zombie-infested hospital where the infected evolve and grow smarter as you go deeper',
  'a zombie city overrun with hordes, scavenging for supplies while avoiding the swarms',
  'an ancient Roman colosseum during its final days as undead gladiators rise again',
  'a medieval siege gone wrong where a plague has turned both armies into the undead',
  'a World War 2 bunker where soldiers on both sides have been turned into something else',
  'a superhero containment facility where powers have gone haywire and heroes turned rogue',
  'an underground villain lair with death traps, henchmen, and a mastermind at its core',
  'a locked manor house where a murder happened and the killer is still inside with you',
  'an underground noir city where every shadow hides a clue and every NPC has a motive',
  'a cursed detective agency where cases from the past literally haunt the halls',
  'a modern city district where fae courts secretly control the criminal underworld',
  'a subway system beneath a city where werewolf gangs and vampire syndicates are at war',
  'an urban rooftop dungeon where magic graffiti comes alive and street spirits guard territory',
]

function randomTheme(): string {
  return DUNGEON_THEMES[Math.floor(Math.random() * DUNGEON_THEMES.length)]
}

function generateImageUrl(dungeonName: string, theme: string): string {
  const prompt = encodeURIComponent(
    `${dungeonName} dark fantasy dungeon ${theme} atmospheric torchlight stone walls volumetric fog dramatic lighting concept art digital painting dark moody`
  )
  const seed = dungeonName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return `https://image.pollinations.ai/prompt/${prompt}?width=832&height=480&nologo=true&seed=${seed}`
}

export async function POST(req: NextRequest) {
  const { players, mode } = await req.json()
  const theme = randomTheme()

  const partyText = players.map((p: {
    username: string
    characterClass: string
    normieId: string
    hasScarredPassive: boolean
  }) =>
    `- ${p.username}: Normie #${p.normieId}, ${p.characterClass}${p.hasScarredPassive ? ' (Scarred)' : ''}`
  ).join('\n')

  const prompt = `You are the Dungeon Master of Normie Dungeons, a D&D-style dungeon crawler built on Normie NFTs.

Generate an opening for a ${mode === 'solo' ? 'solo' : 'party'} dungeon run.

REQUIRED THEME: ${theme}
The dungeon MUST be set in this specific environment. Do not use a generic castle or keep.

${mode === 'party' ? `PARTY:\n${partyText}` : `ADVENTURER:\n${partyText}`}

Respond in this exact JSON format:
{
  "dungeonName": "A unique dungeon name that reflects the theme (4-6 words)",
  "bossName": "The [dramatic boss title and name, e.g. 'The Corrupted Forge Master' or 'Admiral of the Dead Fleet']",
  "opening": "A 3-4 sentence atmospheric opening scene. Address the player(s) by username. Set the mood vividly."
}

Make each run feel completely different. Stick to the required theme.`

  try {
    const raw = await askDM(prompt, 400)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    const imageUrl = generateImageUrl(result.dungeonName, theme)

    return NextResponse.json({
      dungeonName: result.dungeonName,
      bossName: result.bossName || 'The Final Guardian',
      opening: result.opening,
      imageUrl,
    })
  } catch (error) {
    console.error('DM init error:', error)
    const fallbackName = 'The Forgotten Depths'
    return NextResponse.json({
      dungeonName: fallbackName,
      bossName: 'The Depth Keeper',
      opening: 'Ancient stone corridors stretch before you, torchlight casting restless shadows. The air carries the weight of centuries — damp, cold, and thick with the scent of things long dead. Something stirs in the darkness ahead.',
      imageUrl: generateImageUrl(fallbackName, 'ancient stone dungeon'),
    })
  }
}