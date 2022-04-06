import { randomBytes } from 'crypto'
import { omit } from 'lodash'
import { CONSTANTS, MONGO } from '../../configs'
import { BaseModel } from '../base/base.model'

export class UserLogModel extends BaseModel {
  private getSecureFields(fields?: { [key: string]: 0 | 1 }) {
    return {
      _id: 0,
      removed: 0,
      ...fields
    }
  }

  public async store(params: NAMESPACE_USER_LOGS_V1.IUserLogCreate) {
    const key = randomBytes(CONSTANTS.user_log.key_size).toString('hex')
    const data = {
      ...params,
      key,
      removed: false,
      created: new Date(),
      modified: new Date()
    }
    await MONGO.MODELS.USER_LOG.create(data)
    return omit(data, '_id')
  }
}
