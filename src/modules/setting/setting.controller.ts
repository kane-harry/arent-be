import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { CustomRequest } from '@middlewares/request.middleware'
import { requireAdmin } from '@config/role'
import { requireAuth } from '@common/authCheck'
import SettingService from '@modules/setting/setting.service'
import { SettingDto } from '@modules/setting/setting.dto'
import { defaultSetting } from '@modules/setting/setting.interface'

class SettingController implements IController {
    public path = '/settings'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.getGlobalSetting))
        this.router.put(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.updateGlobalSetting))
    }

    private async getGlobalSetting(req: CustomRequest, res: Response) {
        const data = await SettingService.getGlobalSetting()
        return res.json(data)
    }

    private async updateGlobalSetting(req: CustomRequest, res: Response) {
        const params: SettingDto = req.body
        const data = await SettingService.updateGlobalSetting(params)
        return res.json(data)
    }
}

export default SettingController
