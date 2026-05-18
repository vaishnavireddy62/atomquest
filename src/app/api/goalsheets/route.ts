import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const goalSheets = await prisma.goalSheet.findMany({
    where: { employeeId: payload.id },
    include: { goals: { include: { achievements: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ goalSheets })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { goals } = await req.json()
  if (!goals || goals.length === 0) return NextResponse.json({ error: 'No goals provided' }, { status: 400 })
  if (goals.length > 8) return NextResponse.json({ error: 'Maximum 8 goals allowed' }, { status: 400 })
  const totalWeight = goals.reduce((s: number, g: any) => s + Number(g.weightage), 0)
  if (Math.round(totalWeight) !== 100) return NextResponse.json({ error: 'Total weightage must equal 100%' }, { status: 400 })
  if (goals.some((g: any) => Number(g.weightage) < 10)) return NextResponse.json({ error: 'Minimum weightage per goal is 10%' }, { status: 400 })
  const goalSheet = await prisma.goalSheet.create({
    data: {
      employeeId: payload.id,
      status: 'SUBMITTED',
      goals: { create: goals.map((g: any) => ({ thrustArea: g.thrustArea, title: g.title, description: g.description || '', uom: g.uom, target: g.target, weightage: Number(g.weightage) })) },
    },
  })
  return NextResponse.json({ goalSheet })
}