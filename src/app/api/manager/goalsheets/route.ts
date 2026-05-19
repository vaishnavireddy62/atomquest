import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const goalSheets = await prisma.goalSheet.findMany({
    where: { employee: { managerId: payload.id } },
    include: { goals: true, employee: { include: { manager: true } }, checkIns: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ goalSheets })
}