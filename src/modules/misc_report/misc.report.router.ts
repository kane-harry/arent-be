import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import { requireAuth } from '@utils/authCheck'
import Multer from 'multer'
import {
    AdminUpdateMiscReportDto,
    BulkDeleteMiscReportDto,
    BulkUpdateMiscReportStatusDto,
    CreateMiscReportDto,
    UpdateMiscReportDto
} from './misc.report.dto'
import validationMiddleware from '@middlewares/validation.middleware'
import { requireAdmin } from '@config/role'
import MiscReportController from './misc.report.controller'

const upload = Multer()

export default class MiscReportRouter implements ICustomRouter {
    public path = '/misc/reports'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(
            `${this.path}`,
            requireAuth,
            upload.any(),
            validationMiddleware(CreateMiscReportDto),
            asyncHandler(MiscReportController.createMiscReport)
        )
        this.router.get(`${this.path}/`, asyncHandler(MiscReportController.queryMiscReports))
        this.router.get(`${this.path}/:key`, asyncHandler(MiscReportController.getMiscReportDetail))
        this.router.put(
            `${this.path}/:key`,
            requireAuth,
            upload.any(),
            validationMiddleware(UpdateMiscReportDto),
            asyncHandler(MiscReportController.updateMiscReport)
        )
        this.router.put(
            `${this.path}/:key/admin`,
            requireAuth,
            requireAdmin(),
            upload.any(),
            validationMiddleware(AdminUpdateMiscReportDto),
            asyncHandler(MiscReportController.adminUpdateMiscReport)
        )
        this.router.post(
            `${this.path}/status`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(BulkUpdateMiscReportStatusDto),
            asyncHandler(MiscReportController.bulkUpdateMiscReportStatus)
        )
        this.router.delete(
            `${this.path}`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(BulkDeleteMiscReportDto),
            asyncHandler(MiscReportController.bulkDeleteMiscReport)
        )
    }
}
