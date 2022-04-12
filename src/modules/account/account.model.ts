import { Schema, Types, model } from 'mongoose'
import { IAccount } from './account.interface'

const accountSchema = new Schema<IAccount>(
    {
        symbol: { type: String, uppercase: true },
        address: String,
        publicKey: String,
        amount: Types.Decimal128,
        nonce: { type: Number, default: 0 },
        type: { type: String, uppercase: true, default: 'PRIME' },
        raw: { type: Boolean, default: false },
        removed: { type: Boolean, default: false },
        created: { type: Date, default: Date.now },
        modified: { type: Date, default: Date.now }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                ret.amount = Number(ret.amount)
                return ret
            }
        }
    }
)

const AccountModel = model<IAccount>('accounts', accountSchema)

export default AccountModel
