import { Express } from 'express'
import { BaseMiddleware } from '../../filters/middleware'
import { UserController } from './user.controller'
import { connect_wallet, login_by_wallet } from './user.schema'
import passport from 'passport'
const requireAuth = passport.authenticate('jwt', { session: false })

const baseMiddleware = new BaseMiddleware()
const userController = new UserController()

export default (app: Express) => {
  app.post(
    '/users/wallet/connect',
    // connect wallet
    connect_wallet,
    baseMiddleware.validateError,
    userController.connectByWallet
  )

  app.post(
    '/users/wallet/login',
    // login
    login_by_wallet,
    baseMiddleware.validateError,
    userController.loginByWallet
  )

  app.post(
    '/users/wallet/logout',
    // logout
    requireAuth,
    connect_wallet,
    baseMiddleware.validateError,
    userController.logoutByWallet
  )
}
