import { Response } from 'express'
import { CustomRequest } from '@middlewares/request.middleware'
import ExceptionLogsService from '@modules/exception_logs/exception_log.service'
import { IExceptionLogFilter } from '@modules/exception_logs/exception_log.interface'

export default class ExceptionLogController {
    static async queryLogs(req: CustomRequest, res: Response) {
        const filter = req.query as IExceptionLogFilter
        const data = await ExceptionLogsService.queryLogs(filter)
        return res.json(data)
    }
}
