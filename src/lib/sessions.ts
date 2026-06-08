import { supabase } from '@/lib/supabase'
import { Session, SessionMode } from '@/types/game'

function generateInviteCode(): string {
  return 'NRM-' + Math.random().toString(36).substring(2, 5).toUpperCase()
}

export async function createSession(
  hostId: string,
  mode: SessionMode
): Promise<Session | null> {
  const inviteCode = generateInviteCode()

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      invite_code: inviteCode,
      host_id: hostId,
      status: 'lobby',
      mode,
      current_room: 1,
      total_rooms: 3,
    })
    .select()
    .single()

  if (error) {
    console.error('Create session error:', error.message)
    return null
  }

  return data
}

export async function joinSession(
  inviteCode: string
): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .eq('status', 'lobby')
    .maybeSingle()

  if (error || !data) return null
  return data
}

export async function addPlayerToSession(
  sessionId: string,
  userId: string,
  normieId: string,
  characterClass: string,
  stats: Record<string, number>,
  hp: number,
  turnOrder: number
): Promise<boolean> {
  const { error } = await supabase
    .from('session_players')
    .insert({
      session_id: sessionId,
      user_id: userId,
      normie_id: normieId,
      character_class: characterClass,
      stats,
      hp,
      max_hp: hp,
      turn_order: turnOrder,
      is_active: true,
      last_seen: new Date().toISOString(),
    })

  return !error
}

export async function getSessionPlayers(sessionId: string) {
  const { data } = await supabase
    .from('session_players')
    .select('*, users(username, badge)')
    .eq('session_id', sessionId)
    .order('turn_order')

  return data || []
}