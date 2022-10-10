import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import { requireAuth } from '@utils/authCheck'
import { requireAdmin } from '@config/role'
import validationMiddleware from '@middlewares/validation.middleware'
import { SettingDto } from './setting.dto'
import SettingController from './setting.controller'

export default class SettingRouter implements ICustomRouter {
    public path = '/settings'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}/:nav_key`, requireAuth, requireAdmin(), asyncHandler(SettingController.getSettingByNavKey))
        this.router.put(
            `${this.path}/:nav_key`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(SettingDto),
            asyncHandler(SettingController.updateSettingByNavKey)
        )
    }
}
