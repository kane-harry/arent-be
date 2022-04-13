import asyncHandler from '../../common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '../../interfaces/controller.interface'
import validationMiddleware from '../../middlewares/validation.middleware'
import { CreateAccountDto } from './account.dto'
import { IAccount, IAccountFilter } from './account.interface'
import AccountService from './account.service'
import { CustomRequest } from '../../middlewares/request.middleware'

class AccountController implements IController {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, validationMiddleware(CreateAccountDto), asyncHandler(this.createAccount))
        this.router.get(`${this.path}/:address`, asyncHandler(this.getAccount))
        this.router.get(`${this.path}`, asyncHandler(this.queryAccounts))
    }

    private createAccount = async (req: Request, res: Response) => {
        const postData: IAccount = req.body
        const data = await AccountService.createAccount(postData)

        return res.send(data)
    }

    private getAccount = async (req: Request, res: Response) => {
        const address = req.params.address
        const data = await AccountService.getAccount(address)
        return res.send(data)
    }

    private queryAccounts = async (req: CustomRequest, res: Response) => {
        const filter = req.query as IAccountFilter
        const data = await AccountService.queryAccounts(filter)
        return res.send(data)
    }
}

export default AccountController
