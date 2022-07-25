import asyncHandler from '@utils/asyncHandler'
import { Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { CustomRequest } from '@middlewares/request.middleware'
import { requireAdmin } from '@config/role'
import { requireAuth } from '@utils/authCheck'
import SettingService from '@modules/setting/setting.service'
import { SettingDto } from '@modules/setting/setting.dto'
import validationMiddleware from '@middlewares/validation.middleware'

class SettingController implements IController {
    public path = '/settings'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}/:nav_key`, requireAuth, requireAdmin(), asyncHandler(this.getSettingByNavKey))
        this.router.put(
            `${this.path}/:nav_key`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(SettingDto),
            asyncHandler(this.updateSettingByNavKey)
        )
    }

    private async getSettingByNavKey(req: CustomRequest, res: Response) {
        const data = await SettingService.getSettingByNavKey(req.params.nav_key)
        return res.json(data)
    }

    private async updateSettingByNavKey(req: CustomRequest, res: Response) {
        const params: SettingDto = req.body
        const data = await SettingService.updateSettingByNavKey(req.params.nav_key, params)
        return res.json(data)
    }
}

export default SettingController
