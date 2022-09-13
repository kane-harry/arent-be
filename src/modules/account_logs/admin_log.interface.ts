import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import { IAccountLogType } from '@config/constants'

export interface IAccountLog extends IBaseModel {
    type: IAccountLogType
    amount: number | Types.Decimal128
    operator: {
        key: string
        email: string
    }
}
