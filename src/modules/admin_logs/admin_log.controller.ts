import { Response } from 'express'
import AdminLogService from './admin_log.service'
import { CustomRequest } from '@middlewares/request.middleware'
import { downloadResource } from '@utils/utility'
import { ILogFilter } from '@modules/admin_logs/admin_log.interface'

export default class AdminLogController {
    static async queryLogs(req: CustomRequest, res: Response) {
        const filter = req.query as ILogFilter
        const data = await AdminLogService.queryLogs(filter)
        return res.json(data)
    }

    static async exportLogs(req: CustomRequest, res: Response) {
        const filter = req.query as ILogFilter
        const data = await AdminLogService.queryLogs(filter)

        const fields = [
            { label: 'Key', value: 'key' },
            { label: 'Operator', value: 'operator' },
            { label: 'UserKey', value: 'user_key' },
            { label: 'Section', value: 'section' },
            { label: 'Action', value: 'action' },
            { label: 'PreData', value: 'pre_data' },
            { label: 'PostData', value: 'post_data' },
            { label: 'Created', value: 'created' },
            { label: 'Modified', value: 'modified' }
        ]

        return downloadResource(res, 'logs.csv', fields, data.items)
    }
}
