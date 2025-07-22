import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { email }
    })

    if (!user) {
      console.error(`User with email ${email} not found`)
      process.exit(1)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' }
    })

    console.log(`✅ Successfully made ${email} an admin`)
  } catch (error) {
    console.error('Error making user admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.error('Please provide an email address')
  console.log('Usage: npm run make-admin <email>')
  process.exit(1)
}

makeAdmin(email)