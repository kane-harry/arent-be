import { Response } from 'express'
import MiscReportService from './misc.report.service'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { IMiscReportFilter } from '@modules/misc_report/misc.report.interface'
import {
    AdminUpdateMiscReportDto,
    BulkDeleteMiscReportDto,
    BulkUpdateMiscReportStatusDto,
    CreateMiscReportDto,
    UpdateMiscReportDto
} from './misc.report.dto'

export default class MiscReportController {
    static async createMiscReport(req: AuthenticationRequest, res: Response) {
        const createMiscReportDto: CreateMiscReportDto = req.body
        const files = req.files
        const miscReport = await MiscReportService.createMiscReport(createMiscReportDto, files, req.user)
        return res.json(miscReport)
    }

    static async queryMiscReports(req: CustomRequest, res: Response) {
        const filter = req.query as IMiscReportFilter
        const data = await MiscReportService.queryMiscReports(filter)
        return res.json(data)
    }

    static async getMiscReportDetail(req: CustomRequest, res: Response) {
        const { key } = req.params
        const data = await MiscReportService.getMiscReportDetail(key)
        return res.json(data)
    }

    static async updateMiscReport(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const updateMiscReportDto: UpdateMiscReportDto = req.body
        const files = req.files
        const data = await MiscReportService.updateMiscReport(key, updateMiscReportDto, files, req.user)
        return res.json(data)
    }

    static async adminUpdateMiscReport(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const updateMiscReportDto: AdminUpdateMiscReportDto = req.body
        const files = req.files
        const data = await MiscReportService.adminUpdateMiscReport(key, updateMiscReportDto, files, req.user)
        return res.json(data)
    }

    static async bulkUpdateMiscReportStatus(req: AuthenticationRequest, res: Response) {
        const updateMiscReportDto: BulkUpdateMiscReportStatusDto = req.body
        const { keys, status } = updateMiscReportDto
        const data = []
        for (const key of keys) {
            try {
                const item = await MiscReportService.updateMiscReportStatus(key, { status: status }, req.user)
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    static async bulkDeleteMiscReport(req: AuthenticationRequest, res: Response) {
        const deleteMiscReportDto: BulkDeleteMiscReportDto = req.body
        const { keys } = deleteMiscReportDto
        const data = []
        for (const key of keys) {
            try {
                const item = await MiscReportService.deleteMiscReport(key, req.user)
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }
}
