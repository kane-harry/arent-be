import { config } from '@config'
import { randomBytes } from 'crypto'
import { IAccountLog } from '@modules/account_logs/admin_log.interface'
import { IAccountLogType } from '@config/constants'
import { Schema, Types, model } from 'mongoose'

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
        amount: { type: Types.Decimal128, default: new Types.Decimal128('0') }
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
