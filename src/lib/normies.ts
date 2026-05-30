import { NormieTraits, NormieStats, NormieCharacter } from '@/types/normie'

const BASE_URL = process.env.NORMIES_API_BASE || 'https://api.normies.art'

export async function getNormieMetadata(id: string) {
  const res = await fetch(`${BASE_URL}/normie/${id}/metadata`)
  if (!res.ok) throw new Error(`Normie #${id} not found`)
  return res.json()
}

export async function getNormieTraits(id: string): Promise<NormieTraits> {
  const metadata = await getNormieMetadata(id)
  const attrs = metadata.attributes || []

  const get = (trait: string) =>
    attrs.find((a: { trait_type: string; value: string | number }) =>
      a.trait_type.toLowerCase() === trait.toLowerCase()
    )?.value

  return {
    type: get('Type') || 'Human',
    gender: get('Gender') || 'Unknown',
    age: get('Age') || 'Unknown',
    hairStyle: get('Hair Style') || 'None',
    facialFeature: get('Facial Feature') || 'None',
    eyes: get('Eyes') || 'None',
    expression: get('Expression') || 'Neutral',
    accessory: get('Accessory') || 'None',
    level: Number(get('Level')) || 1,
    actionPoints: Number(get('Action Points')) || 0,
    customized: get('Customized') === 'Yes',
  }
}

export function traitsToStats(traits: NormieTraits): NormieStats {
  const hash = (str: string) =>
    str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const scale = (val: number, min = 8, max = 18) =>
    min + (val % (max - min + 1))

  // Level bonus — higher level Normies get +1 to all stats per level
  const levelBonus = Math.min(traits.level, 5)

  return {
    str: scale(hash(traits.facialFeature)) + levelBonus,
    dex: scale(hash(traits.accessory)) + levelBonus,
    con: scale(hash(traits.age)) + levelBonus,
    int: scale(hash(traits.hairStyle)) + levelBonus,
    wis: scale(hash(traits.eyes)) + levelBonus,
    cha: scale(hash(traits.expression)) + levelBonus,
  }
}

export function assignClass(stats: NormieStats): string {
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 2).map(([k]) => k)

  if (top.includes('str') && top.includes('con')) return 'Warrior'
  if (top.includes('dex') && top.includes('cha')) return 'Rogue'
  if (top.includes('int') && top.includes('wis')) return 'Mage'
  if (top.includes('dex') && top.includes('wis')) return 'Ranger'
  if (top.includes('cha') && top.includes('int')) return 'Bard'
  return 'Adventurer'
}

export function calculateMaxHp(stats: NormieStats): number {
  return 10 + Math.floor(stats.con / 2)
}

export async function buildNormieCharacter(id: string): Promise<NormieCharacter> {
  const traits = await getNormieTraits(id)
  const stats = traitsToStats(traits)
  const characterClass = assignClass(stats)
  const maxHp = calculateMaxHp(stats)

  return {
    id,
    traits,
    stats,
    characterClass,
    maxHp,
    imageUrl: `https://api.normies.art/normie/${id}/image.png`,
    hasScarredPassive: traits.customized,
  }
}