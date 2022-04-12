// import { IUser, IUserFilter } from './user.interface';
// import UserModel from './user.model';
// import { createWallet } from '../../utils/wallet'
// import { QueryRO } from '../../interfaces/qurey.model';

import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'

export default class UserService {
  static createCreateTransaction = async (transactionParams: any) => {
    throw new BizException(
      { message: 'Not implemented.', status: 400, code: 400 },
      new ErrorContext('transaction.service', 'createCreateTransaction', {})
    )
  }

  static getTransactionById = async (id: string) => {
    throw new BizException({ message: 'Not implemented.', status: 400, code: 400 }, new ErrorContext('transaction.service', 'getTransactionById', {}))
  }
}
