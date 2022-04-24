import { Router, Request, Response } from 'express'
import asyncHandler from '@common/asyncHandler'
import IController from '@interfaces/controller.interface'
import { MintDto } from '@modules/account/account.dto'
import validationMiddleware from '@middlewares/validation.middleware'
import AccountMasterService from './account.master.service'
import { requireAuth } from '@common/authCheck'
import permissionMiddleware from '@middlewares/permission.middleware'

class AccountController implements IController {
    public path = '/master/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, requireAuth, permissionMiddleware(), asyncHandler(this.initMasterAccounts))
        this.router.get(`${this.path}`, requireAuth, permissionMiddleware(), asyncHandler(this.getMasterAccounts))
        this.router.post(
            `${this.path}/:key/mint`,
            requireAuth,
            permissionMiddleware(),
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
