import { NextFunction, Request, Response } from 'express'
import { loggingError } from '../../logging'
import { BaseController } from '../base/base.controller'
import { UserService } from './user.service'

const userService = new UserService()

export class UserController extends BaseController {
  public async connectByWallet(req: Request, res: Response, next: NextFunction) {
    const walletAddress = req.body.wallet_address
    try {
      const client = super.getClientInfo(req)
      const data = await userService.connectByWallet({ wallet_address: walletAddress }, client)
      return res.json(data)
    } catch (err) {
      loggingError({
        data: { walletAddress },
        error_detail: String(err),
        functionName: 'connectByWallet',
        message: ''
      })
      next(err)
    }
  }

  public async loginByWallet(req: Request, res: Response, next: NextFunction) {
    const walletAddress = req.body.wallet_address
    const signature = req.body.signature
    try {
      const data = await userService.loginByWallet({ wallet_address: walletAddress, signature })
      return res.json(data)
    } catch (err) {
      loggingError({
        data: { walletAddress, signature },
        error_detail: String(err),
        functionName: 'loginByWallet',
        message: ''
      })
      next(err)
    }
  }

  public async logoutByWallet(req: Request, res: Response, next: NextFunction) {
    const walletAddress = req.body.wallet_address
    try {
      const data = await userService.logoutByWallet({ wallet_address: walletAddress })
      return res.json(data)
    } catch (err) {
      loggingError({
        data: { walletAddress },
        error_detail: String(err),
        functionName: 'logoutByWallet',
        message: ''
      })
      next(err)
    }
  }
}
