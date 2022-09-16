import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import { requireAuth } from '@utils/authCheck'
import { requireAdmin } from '@config/role'
import ICustomRouter from '@interfaces/custom.router.interface'
import AdminLogController from './admin_log.controller'

export default class AdminLogRouter implements ICustomRouter {
    public path = '/admin-logs'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    // all for admin only
    private initRoutes() {
        this.router.get(`${this.path}/`, requireAuth, requireAdmin(), asyncHandler(AdminLogController.queryLogs))
        this.router.get(`${this.path}/export`, requireAuth, requireAdmin(), asyncHandler(AdminLogController.exportLogs))
    }
}
