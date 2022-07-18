import asyncHandler from '@utils/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { MintDto, WithdrawDto } from './account.dto'
import { AccountService, AdminAccountService, UserAccountService } from './account.service'
import { requireAuth } from '@utils/authCheck'
import UserModel from '@modules/user/user.model'
import BizException from '@exceptions/biz.exception'
import { AccountErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { requireAdmin } from '@config/role'

export class UserAccountController implements IController {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}/me`, requireAuth, asyncHandler(this.getAccountsByOwner))
        this.router.get(`${this.path}/me/detail`, requireAuth, asyncHandler(this.getAccountDetailByOwner))
        this.router.post(`${this.path}/:key/withdraw`, requireAuth, validationMiddleware(WithdrawDto), asyncHandler(this.withdraw))
    }

    private async getAccountsByOwner(req: AuthenticationRequest, res: Response) {
        const { filters, pageindex, pagesize } = req.query
        const data = await UserAccountService.queryAccounts(
            {
                ...filters,
                userKey: req.user.key
            },
            {
                pageindex,
                pagesize
            }
        )
        return res.json(data)
    }

    private async getAccountDetailByOwner(req: AuthenticationRequest, res: Response) {
        const { filters } = req.query
        const data = await UserAccountService.getAccountDetailByFields({
            ...filters,
            userKey: req.user.key
        })
        return res.json(data)
    }

    private async withdraw(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: WithdrawDto = req.body
        const operator = await UserModel.findOne({ email: req.user?.email }).exec()
        if (!operator) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.controller', 'withdraw', { key }))
        }
        const data = await AccountService.withdraw(key, params, operator)
        return res.json(data)
    }
}

export class AdminAccountController implements IController {
    public path = '/master/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.queryAccounts))
        this.router.get(`${this.path}/detail`, requireAuth, requireAdmin(), asyncHandler(this.getAccountDetail)) // add filter query, merge to 1 api
        this.router.post(`${this.path}/:key/withdraw`, requireAuth, requireAdmin(), validationMiddleware(WithdrawDto), asyncHandler(this.withdraw))

        this.router.post(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.initMasterAccounts))
        this.router.post(`${this.path}/:key/mint`, requireAuth, requireAdmin(), validationMiddleware(MintDto), asyncHandler(this.mintMasterAccount))
    }

    private async queryAccounts(req: AuthenticationRequest, res: Response) {
        const { filters, pageindex, pagesize } = req.query
        const data = await AdminAccountService.queryAccounts(
            {
                ...filters
            },
            {
                pageindex,
                pagesize
            }
        )
        return res.json(data)
    }

    private async getAccountDetail(req: AuthenticationRequest, res: Response) {
        const { filters } = req.query
        const data = await AdminAccountService.getAccountDetailByFields({
            ...filters
        })
        return res.json(data)
    }

    private async withdraw(req: AuthenticationRequest, res: Response) {
        // TODO: export for user ?
        // const key = req.params.key
        // const params: WithdrawDto = req.body
        // const operator = await UserModel.findOne({ email: req.user?.email }).exec()
        // if (!operator) {
        //     throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.controller', 'withdraw', { key }))
        // }
        // const data = await AccountService.withdraw(key, params, operator)
        return res.json({ implemented: false })
    }

    private async initMasterAccounts(req: Request, res: Response) {
        const data = await AdminAccountService.initMasterAccounts()
        return res.json(data)
    }

    private async mintMasterAccount(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: MintDto = req.body
        const data = await AdminAccountService.mintMasterAccount(key, params, { email: req.user?.email, userKey: req.user?.key })
        return res.json(data)
    }
}
