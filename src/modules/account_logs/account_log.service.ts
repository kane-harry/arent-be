import { IAccountLog } from '@modules/account_logs/account_log.interface'
import AccountLogModel from './account_log.model'

export default class AccountLogsService {
    static async createAccountLog(params: IAccountLog) {
        const model = new AccountLogModel({
            ...params
        })
        return await model.save()
    }
}
