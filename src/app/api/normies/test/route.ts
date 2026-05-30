import { buildNormieCharacter } from '@/lib/normies'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const normie = await buildNormieCharacter('1')
    return NextResponse.json({ success: true, normie })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}