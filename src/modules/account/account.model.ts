import { config } from '@config'
import { AccountExtType, AccountType } from '@config/constants'
import { randomBytes } from 'crypto'
import { Schema, Types, model } from 'mongoose'
import { IAccount } from './account.interface'

const accountSchema = new Schema<IAccount>(
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
        user_key: String,
        name: String,
        symbol: { type: String, uppercase: true, index: true },
        platform: String,
        type: { type: String, enum: AccountType, default: AccountType.Ext },
        ext_type: { type: String, enum: AccountExtType, default: AccountExtType.Prime },
        address: String,
        amount: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        amount_locked: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        salt: { type: String, select: false },
        key_store: { type: Object },
        meta_data: Object,
        ext_key: String,
        sync_timestamp: { type: Number, default: 0, index: true },
        deposited: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        withdrew: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        committed: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                ret.amount = parseFloat(ret.amount)
                ret.amount_locked = parseFloat(ret.amount_locked)
                ret.deposited = parseFloat(ret.deposited)
                ret.withdrew = parseFloat(ret.withdrew)
                ret.committed = parseFloat(ret.committed)
                return ret
            }
            // getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.accounts
    }
)

const AccountModel = model<IAccount>(config.database.tables.accounts, accountSchema)

export default AccountModel
