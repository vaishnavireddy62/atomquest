import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = verifyToken(token || '')
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await prisma.user.findMany({
    include: { manager: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, manager: u.manager })) })
}