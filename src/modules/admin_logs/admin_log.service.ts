import {IAdminLog, ILogFilter} from "@modules/admin_logs/admin_log.interface";
import AdminLogModel from "@modules/admin_logs/admin_log.model";
import {QueryRO} from "@interfaces/query.model";

export default class AdminLogsService {
    static async queryLogs(params: ILogFilter) {
        const offset = (params.pageindex - 1) * params.pagesize
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.sortby) {
            delete sorting._id
            sorting[`${params.sortby}`] = params.orderby === 'asc' ? 1 : -1
        }
        const totalCount = await AdminLogModel.countDocuments(filter)
        const items = await AdminLogModel.find<IAdminLog>(filter).sort(sorting).skip(offset).limit(params.pagesize).exec()
        return new QueryRO<IAdminLog>(totalCount, params.pageindex, params.pagesize, items)
    }
}
