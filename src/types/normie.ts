export interface NormieTraits {
  type: string
  gender: string
  age: string
  hairStyle: string
  facialFeature: string
  eyes: string
  expression: string
  accessory: string
  level: number
  actionPoints: number
  customized: boolean
}

export interface NormieStats {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface NormieCharacter {
  id: string
  traits: NormieTraits
  stats: NormieStats
  characterClass: string
  maxHp: number
  imageUrl: string
  hasScarredPassive: boolean
}