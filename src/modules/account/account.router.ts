import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import { requireAuth } from '@utils/authCheck'
import { requireAdmin, requireOwner } from '@config/role'
import validationMiddleware from '@middlewares/validation.middleware'
import ICustomRouter from '@interfaces/custom.router.interface'
import AccountController from './account.controller'
import { MintDto, WithdrawDto } from './account.dto'

export default class AccountRouter implements ICustomRouter {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        /** MASTER */
        this.router.post(`${this.path}/master`, requireAuth, requireAdmin(), asyncHandler(AccountController.initMasterAccounts))
        this.router.post(
            `${this.path}/:key/mint`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(MintDto),
            asyncHandler(AccountController.mintMasterAccount)
        )

        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(AccountController.queryAccounts))
        this.router.get(`${this.path}/users/me`, requireAuth, asyncHandler(AccountController.getAccountsByOwner))
        this.router.get(`${this.path}/:key`, asyncHandler(AccountController.getAccountByKey))
        this.router.post(
            `${this.path}/:key/withdraw`,
            requireAuth,
            requireOwner('resources'),
            validationMiddleware(WithdrawDto),
            asyncHandler(AccountController.withdraw)
        )
    }
}
