import { IAccountLog } from '@modules/account_logs/admin_log.interface'
import AccountLogModel from '@modules/account_logs/admin_log.model'

export default class AccountLogsService {
    static async createAccountLog(params: IAccountLog) {
        const model = new AccountLogModel({
            ...params
        })
        return await model.save()
    }
}
