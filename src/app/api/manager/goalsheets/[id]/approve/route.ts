import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.goalSheet.update({
    where: { id: params.id },
    data: { status: 'APPROVED' },
  })
  await prisma.goal.updateMany({
    where: { goalSheetId: params.id },
    data: { isLocked: true },
  })
  return NextResponse.json({ success: true })
}