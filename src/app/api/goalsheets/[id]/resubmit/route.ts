import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get('token')?.value
    const payload = verifyToken(token || '')
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const body = await req.json()
    const goals = body.goals || body

    const goalSheet = await prisma.goalSheet.findFirst({
      where: { id, employeeId: payload.id }
    })
    if (!goalSheet) return NextResponse.json({ error: 'Goal sheet not found' }, { status: 404 })

    await prisma.goal.deleteMany({ where: { goalSheetId: id } })
    await prisma.goalSheet.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        goals: {
          create: goals.map((g: any) => ({
  thrustArea: g.thrustArea || '',
  title: g.title || '',
  description: g.description || '',
  uom: g.uom || 'NUMERIC_MIN',
  target: String(g.target || ''),
  weightage: Number(g.weightage || 0),
  isShared: false,
  isLocked: false,
}))
        }
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resubmit error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}