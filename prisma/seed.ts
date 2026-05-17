import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPass = await bcrypt.hash('admin123', 10)
  const managerPass = await bcrypt.hash('manager123', 10)
  const employeePass = await bcrypt.hash('employee123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atomquest.com' },
    update: {},
    create: { email: 'admin@atomquest.com', password: adminPass, name: 'Admin User', role: 'ADMIN' },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@atomquest.com' },
    update: {},
    create: { email: 'manager@atomquest.com', password: managerPass, name: 'Manager User', role: 'MANAGER' },
  })

  await prisma.user.upsert({
    where: { email: 'employee@atomquest.com' },
    update: {},
    create: { email: 'employee@atomquest.com', password: employeePass, name: 'Employee User', role: 'EMPLOYEE', managerId: manager.id },
  })

  console.log('Seeded: admin, manager, employee')
}

main().catch(console.error).finally(() => prisma.$disconnect())