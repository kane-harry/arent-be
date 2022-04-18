import { Schema, Types, model } from 'mongoose'
import { IAccount } from './account.interface'

const accountSchema = new Schema<IAccount>(
    {
        key: { type: String, required: true, index: true, unique: true },
        userId: String,
        name: String,
        symbol: { type: String, uppercase: true, index: true },
        platform: String,
        type: { type: String, uppercase: true, default: 'EXT' },
        extType: { type: String, uppercase: true, default: 'PRIME' },
        address: String,
        amount: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        amountLocked: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        salt: { type: String, select: false },
        keyStore: { type: Object },
        metaData: Object,
        extKey: String,
        syncTimestamp: { type: Number, default: 0, index: true },
        deposited: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        withdrawed: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        committed: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                ret.amount = Number(ret.amount)
                ret.amountLocked = Number(ret.amountLocked)
                ret.deposited = Number(ret.deposited)
                ret.withdrawed = Number(ret.withdrawed)
                ret.committed = Number(ret.committed)
                return ret
            }
            // getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        }
    }
)

const AccountModel = model<IAccount>('accounts', accountSchema)

export default AccountModel
