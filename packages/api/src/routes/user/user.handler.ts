import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import type { GetUserAccountsRoute, GetUserRoute, GetUserSessionRoute } from './user.route'

export const getUser: AppRouteHandler<GetUserRoute> = async c => {
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }
  // Ensure the success response matches the expected schema
  return c.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    HttpStatusCodes.OK,
  )
}

export const getUserSession: AppRouteHandler<GetUserSessionRoute> = async c => {
  const session = c.get('session')
  const user = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  return c.json(session, HttpStatusCodes.OK)
}

export const getUserAccounts: AppRouteHandler<GetUserAccountsRoute> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  const accounts = await db.query.account.findMany({
    columns: { providerId: true },
    where: (accounts, { eq }) => eq(accounts.userId, user.id),
  })

  if (!accounts) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  return c.json(accounts, HttpStatusCodes.OK)
}
