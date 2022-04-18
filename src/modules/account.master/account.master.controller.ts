import asyncHandler from '../../common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '../../interfaces/controller.interface'
import AccountMasterService from './account.master.service'
import { MintDto } from '../account/account.dto'
import validationMiddleware from '../../middlewares/validation.middleware'
// import { requireAuth } from '../../common/authCheck'

class AccountController implements IController {
    public path = '/master/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, asyncHandler(this.initMasterAccounts))
        this.router.get(`${this.path}`, asyncHandler(this.getMasterAccounts))
        this.router.post(`${this.path}/:key/mint`, validationMiddleware(MintDto), asyncHandler(this.mintMasterAccount))
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
