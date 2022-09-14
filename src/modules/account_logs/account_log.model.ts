import { config } from '@config'
import { randomBytes } from 'crypto'
import { IAccountLogType } from '@config/constants'
import { Schema, Types, model } from 'mongoose'
import { IAccountLog } from '@modules/account_logs/account_log.interface'

const AccountLogsSchema = new Schema<IAccountLog>(
    {
        key: {
            type: String,
            required: true,
            index: true,
            unique: true,
            default: () => {
                return randomBytes(16).toString('hex')
            }
        },
        operator: {
            type: Object,
            required: true
        },
        type: { type: String, enum: IAccountLogType },
        amount: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        note: String
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const AccountLogModel = model<IAccountLog>(config.database.tables.account_logs, AccountLogsSchema)

export default AccountLogModel
