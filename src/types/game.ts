export type SessionStatus = 'lobby' | 'active' | 'completed'
export type SessionMode = 'solo' | 'party'
export type MessageType = 'player_action' | 'dm_narration' | 'system'
export type Badge = 'verified' | 'adventurer'

export interface User {
  id: string
  username: string
  walletAddress?: string
  badge: Badge
  sessionToken?: string
}

export interface DiceRoll {
  type: string
  result: number
  modifier: number
  total: number
}

export interface Message {
  id: string
  sessionId: string
  playerId?: string
  type: MessageType
  content: string
  diceRoll?: DiceRoll
  createdAt: string
}

export interface SessionPlayer {
  id: string
  sessionId: string
  userId: string
  normieId: string
  characterClass: string
  stats: Record<string, number>
  hp: number
  maxHp: number
  turnOrder: number
  isActive: boolean
  lastSeen: string
  username?: string
  badge?: Badge
}

export interface GameState {
  id: string
  sessionId: string
  currentTurnPlayerId: string
  dungeonName: string
  dungeonDescription: string
  currentRoomDescription: string
  state: Record<string, unknown>
  updatedAt: string
}

export interface Session {
  id: string
  inviteCode: string
  hostId: string
  status: SessionStatus
  mode: SessionMode
  currentRoom: number
  totalRooms: number
  createdAt: string
  updatedAt: string
}