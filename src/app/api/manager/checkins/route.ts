import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { goalSheetId, quarter, comment } = await req.json()
  const checkIn = await prisma.checkIn.create({
    data: { goalSheetId, managerId: payload.id, quarter, comment },
  })
  return NextResponse.json({ checkIn })
}