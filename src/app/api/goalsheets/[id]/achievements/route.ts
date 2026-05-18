import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { quarter, achievements } = await req.json()
  // achievements = [{ goalId, actual, status }]

  if (!quarter || !achievements) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  // Verify this goalsheet belongs to the employee
  const goalSheet = await prisma.goalSheet.findFirst({
    where: { id: params.id, employeeId: payload.id, status: 'APPROVED' },
    include: { goals: true }
  })
  if (!goalSheet) return NextResponse.json({ error: 'Goal sheet not found or not approved' }, { status: 404 })

  // Upsert achievements for each goal
  const results = await Promise.all(achievements.map(async (a: any) => {
    const goal = goalSheet.goals.find(g => g.id === a.goalId)
    if (!goal) return null

    // Calculate score based on UoM
    let score = 0
    const actual = parseFloat(a.actual) || 0
    const target = parseFloat(goal.target) || 1
    if (goal.uom === 'NUMERIC_MIN') score = Math.min((actual / target) * 100, 100)
    else if (goal.uom === 'NUMERIC_MAX') score = Math.min((target / actual) * 100, 100)
    else if (goal.uom === 'ZERO') score = actual === 0 ? 100 : 0
    else score = a.status === 'COMPLETED' ? 100 : 0

    return prisma.achievement.upsert({
      where: { goalId_quarter: { goalId: a.goalId, quarter } },
      update: { actual: a.actual, status: a.status, score },
      create: { goalId: a.goalId, quarter, actual: a.actual, status: a.status, score }
    })
  }))

  return NextResponse.json({ results })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const goalSheet = await prisma.goalSheet.findFirst({
    where: { id: params.id },
    include: { goals: { include: { achievements: true } } }
  })
  if (!goalSheet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ goalSheet })
}