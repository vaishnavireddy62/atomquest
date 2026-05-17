import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
      const { createClient } = await import('@libsql/client')
      const client = createClient({ url: 'file:./prisma/dev.db' })
      return new PrismaLibSQL(client)
    },
  },
})