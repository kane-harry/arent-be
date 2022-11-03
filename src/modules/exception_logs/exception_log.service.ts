import ExceptionLogModel from '@modules/exception_logs/exception_log.model'
import { QueryRO } from '@interfaces/query.model'
import { IExceptionLog, IExceptionLogFilter } from '@modules/exception_logs/exception_log.interface'

export default class ExceptionLogsService {
    static async queryLogs(params: IExceptionLogFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms, 'i')
            filter.$or = [{ key: reg }, { agent: reg }, { ip_address: reg }, { 'exception.code': reg }, { 'exception.message': reg }]
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await ExceptionLogModel.countDocuments(filter)
        const items = await ExceptionLogModel.find<IExceptionLog>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<IExceptionLog>(totalCount, params.page_index, params.page_size, items)
    }
}
