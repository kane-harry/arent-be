import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CustomRequest } from '@middlewares/request.middleware'
import { WithdrawDto } from './account.dto'
import { IAccountFilter } from './account.interface'
import AccountService from './account.service'
// import { requireAuth } from '@common/authCheck'

class AccountController implements IController {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}`, asyncHandler(this.queryAccounts))
        this.router.get(`${this.path}/:key`, asyncHandler(this.getAccountByKey))
        this.router.get(`${this.path}/user/:id`, asyncHandler(this.getUserAccounts))
        this.router.post(`${this.path}/:key/withdraw`, validationMiddleware(WithdrawDto), asyncHandler(this.withdraw))
    }

    private async getAccountByKey(req: Request, res: Response) {
        const key = req.params.key
        const data = await AccountService.getAccountByKey(key)
        return res.json(data)
    }

    private async queryAccounts(req: CustomRequest, res: Response) {
        const filter = req.query as IAccountFilter
        const data = await AccountService.queryAccounts(filter)
        return res.json(data)
    }

    private async getUserAccounts(req: CustomRequest, res: Response) {
        const userId = req.params.userId
        const data = await AccountService.getUserAccounts(userId)
        return res.json(data)
    }

    private async withdraw(req: CustomRequest, res: Response) {
        const key = req.params.key
        const params: WithdrawDto = req.body
        const data = await AccountService.withdraw(key, params)
        return res.json(data)
    }
}

export default AccountController
