import asyncHandler from '../../common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '../../interfaces/controller.interface'
import validationMiddleware from '../../middlewares/validation.middleware'
import { WithdrawDto } from './account.dto'
import { IAccountFilter } from './account.interface'
import AccountService from './account.service'
import { CustomRequest } from '../../middlewares/request.middleware'
// import { requireAuth } from '../../common/authCheck'

class AccountController implements IController {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, asyncHandler(this.initMasterAccounts))
        this.router.get(`${this.path}`, asyncHandler(this.queryAccounts))
        this.router.get(`${this.path}/:id`, asyncHandler(this.getAccount))
        // this.router.get(`${this.path}/:id/txns`, asyncHandler(this.getAccountTxns))
        this.router.get(`${this.path}/user/:id`, asyncHandler(this.getUserAccounts))
        this.router.post(`${this.path}/:id/withdraw`, validationMiddleware(WithdrawDto), asyncHandler(this.withdraw))
    }

    private async initMasterAccounts(req: Request, res: Response) {
        const data = await AccountService.initUserAccounts('MASTER')
        return res.send(data)
    }

    private async getAccount(req: Request, res: Response) {
        const id = req.params.id
        const data = await AccountService.getAccount(id)
        return res.send(data)
    }

    private async queryAccounts(req: CustomRequest, res: Response) {
        const filter = req.query as IAccountFilter
        const data = await AccountService.queryAccounts(filter)
        return res.send(data)
    }

    private async getUserAccounts(req: CustomRequest, res: Response) {
        const id = req.params.id
        const data = await AccountService.getUserAccounts(id)
        return res.send(data)
    }

    private async withdraw(req: CustomRequest, res: Response) {
        const id = req.params.id
        const params: WithdrawDto = req.body
        const data = await AccountService.withdraw(id, params)
        return res.send(data)
    }
}

export default AccountController
