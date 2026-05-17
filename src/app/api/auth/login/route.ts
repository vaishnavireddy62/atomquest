import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    return NextResponse.json({ test: true, email, password: '***' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}