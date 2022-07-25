import asyncHandler from '@utils/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { MintDto, WithdrawDto } from './account.dto'
import { IAdminAccountsFilter, IUserAccountsFilter } from './account.interface'
import AccountService from './account.service'
import { requireAuth } from '@utils/authCheck'
import { requireAdmin, requireOwner } from '@config/role'

class AccountController implements IController {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        /** MASTER */
        this.router.post(`${this.path}/master`, requireAuth, requireAdmin(), asyncHandler(this.initMasterAccounts))
        this.router.post(`${this.path}/:key/mint`, requireAuth, requireAdmin(), validationMiddleware(MintDto), asyncHandler(this.mintMasterAccount))

        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.queryAccounts))
        this.router.get(`${this.path}/users/me`, requireAuth, asyncHandler(this.getAccountsByOwner))
        this.router.get(`${this.path}/:key`, asyncHandler(this.getAccountByKey))
        this.router.post(
            `${this.path}/:key/withdraw`,
            requireAuth,
            requireOwner('resources'),
            validationMiddleware(WithdrawDto),
            asyncHandler(this.withdraw)
        )
    }

    /** MASTER */
    private async initMasterAccounts(req: Request, res: Response) {
        const data = await AccountService.initMasterAccounts()
        return res.json(data)
    }

    private async mintMasterAccount(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: MintDto = req.body
        const data = await AccountService.mintMasterAccount(key, params, { email: req.user?.email, userKey: req.user?.key })
        return res.json(data)
    }

    private async queryAccounts(req: AuthenticationRequest, res: Response) {
        const { addresses, key, keys, removed, symbol, symbols, user_key, type, page_index, page_size } = req.query as IAdminAccountsFilter
        const data = await AccountService.queryAccounts(
            {
                addresses,
                key,
                keys,
                removed,
                symbol,
                symbols,
                user_key,
                type
            },
            {
                page_index,
                page_size
            }
        )
        return res.json(data)
    }

    /** NORMAL */
    private async getAccountByKey(req: Request, res: Response) {
        const key = req.params.key
        const data = await AccountService.getAccountDetailByFields({ key })
        return res.json(data)
    }

    private async getAccountsByOwner(req: AuthenticationRequest, res: Response) {
        const { addresses, key, keys, symbols, page_index, page_size } = req.query as IUserAccountsFilter
        const data = await AccountService.queryAccounts(
            {
                key,
                addresses,
                keys,
                symbols,
                user_key: req.user.key
            },
            {
                page_index,
                page_size
            }
        )
        return res.json(data)
    }

    private async withdraw(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: WithdrawDto = req.body
        const data = await AccountService.withdraw(key, params, req.user)
        return res.json(data)
    }
}

export default AccountController
