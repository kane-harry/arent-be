import { IAdminLog, ILogFilter } from '@modules/admin_logs/admin_log.interface'
import AdminLogModel from '@modules/admin_logs/admin_log.model'
import { QueryRO } from '@interfaces/query.model'

export default class AdminLogsService {
    static async queryLogs(params: ILogFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms, 'i')
            filter.$or = [{ key: reg }, { action: reg }, { section: reg }]
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await AdminLogModel.countDocuments(filter)
        const items = await AdminLogModel.find<IAdminLog>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<IAdminLog>(totalCount, params.page_index, params.page_size, items)
    }
}
