import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import { requireAuth } from '@utils/authCheck'
import { requireAdmin } from '@config/role'
import ICustomRouter from '@interfaces/custom.router.interface'
import ExceptionLogController from '@modules/exception_logs/exception_log.controller'

export default class ExceptionLogRouter implements ICustomRouter {
    public path = '/exception-logs'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    // all for admin only
    private initRoutes() {
        this.router.get(`${this.path}/`, requireAuth, requireAdmin(), asyncHandler(ExceptionLogController.queryLogs))
    }
}
