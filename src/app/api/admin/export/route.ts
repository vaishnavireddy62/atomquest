import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const goalSheets = await prisma.goalSheet.findMany({
    include: { goals: { include: { achievements: true } }, employee: true },
  })
  const rows = ['Employee,Email,Thrust Area,Goal Title,UoM,Target,Weightage,Status']
  for (const gs of goalSheets) {
    for (const g of gs.goals) {
      rows.push(`"${gs.employee.name}","${gs.employee.email}","${g.thrustArea}","${g.title}","${g.uom}","${g.target}","${g.weightage}%","${gs.status}"`)
    }
  }
  return new NextResponse(rows.join('\n'), {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=achievement-report.csv' },
  })
}