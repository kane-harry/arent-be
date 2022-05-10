import { Router, Request, Response } from 'express'
import asyncHandler from '@common/asyncHandler'
import IController from '@interfaces/controller.interface'
import { MintDto } from '@modules/account/account.dto'
import validationMiddleware from '@middlewares/validation.middleware'
import AccountMasterService from './account.master.service'
import { requireAuth } from '@common/authCheck'
import {requireAdmin} from "@config/role";

class AccountController implements IController {
    public path = '/master/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.initMasterAccounts))
        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.getMasterAccounts))
        this.router.post(
            `${this.path}/:key/mint`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(MintDto),
            asyncHandler(this.mintMasterAccount)
        )
    }

    private async initMasterAccounts(req: Request, res: Response) {
        const data = await AccountMasterService.initMasterAccounts()
        return res.json(data)
    }

    private async getMasterAccounts(req: Request, res: Response) {
        const data = await AccountMasterService.getMasterAccounts()
        return res.json(data)
    }

    private async mintMasterAccount(req: Request, res: Response) {
        const key = req.params.key
        const params: MintDto = req.body
        const data = await AccountMasterService.mintMasterAccount(key, params)
        return res.json(data)
    }
}

export default AccountController
