import asyncHandler from '@utils/asyncHandler'
import {Router, Response} from 'express'
import IController from '@interfaces/controller.interface'
import AdminLogService from './admin_log.service'
import {CustomRequest} from '@middlewares/request.middleware'
import {downloadResource} from "@utils/utility";
import {requireAuth} from "@utils/authCheck";
import {requireAdmin} from "@config/role";
import {ILogFilter} from "@modules/admin_logs/admin_log.interface";

class AdminLogController implements IController {
    public path = '/admin_logs'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    // all for admin only
    private initRoutes() {
        this.router.get(`${this.path}/`, requireAuth, requireAdmin(), asyncHandler(this.queryLogs))
        this.router.get(`${this.path}/export`, requireAuth, requireAdmin(), asyncHandler(this.exportLogs))
    }

    private async queryLogs(req: CustomRequest, res: Response) {
        const filter = req.query as ILogFilter
        const data = await AdminLogService.queryLogs(filter)
        return res.json(data)
    }

    private async exportLogs(req: CustomRequest, res: Response) {
        const filter = req.query as ILogFilter
        const data = await AdminLogService.queryLogs(filter)

        const fields = [
            {label: 'Key', value: 'key'},
            {label: 'Operator', value: 'operator'},
            {label: 'UserKey', value: 'userKey'},
            {label: 'Section', value: 'section'},
            {label: 'Action', value: 'action'},
            {label: 'PreData', value: 'preData'},
            {label: 'PostData', value: 'postData'},
            {label: 'Created', value: 'created'},
            {label: 'Modified', value: 'modified'}
        ]

        return downloadResource(res, 'transactions.csv', fields, data.items)
    }
}

export default AdminLogController
