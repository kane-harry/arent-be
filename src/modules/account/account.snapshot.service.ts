import { IAccountSnapshot } from './account.interface'
import { AccountSnapshotModel } from './account.model'

export default class AccountLogsService {
    static async createAccountSnapshot(params: IAccountSnapshot) {
        const model = new AccountSnapshotModel({
            ...params
        })
        return await model.save()
    }
}
