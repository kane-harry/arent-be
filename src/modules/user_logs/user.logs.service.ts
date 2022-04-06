import { BaseService } from '../base/base.service'
import { UserLogModel } from './user.logs.model'

const userLogModel = new UserLogModel()
export class UserLogService extends BaseService {
  public async store(params: NAMESPACE_USER_LOGS_V1.IUserLogCreate) {
    return await userLogModel.store(params)
  }
}
