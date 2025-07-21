import { auth, currentUser } from '@clerk/nextjs/server'
import { User } from '@prisma/client'
import { db } from './db'

export async function getAuthUser() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    return null
  }
  
  let dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  })
  
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        twitchId: clerkUser.externalAccounts.find(acc => acc.provider === 'oauth_twitch')?.externalId,
        twitchUsername: clerkUser.externalAccounts.find(acc => acc.provider === 'oauth_twitch')?.username,
      }
    })
  }
  
  return dbUser
}

export async function requireAuthUser(): Promise<User> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}