import { config } from '@config'
import { Schema, Types, model } from 'mongoose'
import { ISetting } from './setting.interface'

const settingSchema = new Schema<ISetting>(
    {
        nav_key: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        registration_require_email_verified: {
            type: Boolean,
            required: true
        },
        registration_require_phone_verified: {
            type: Boolean,
            required: true
        },
        login_require_mfa: {
            type: Boolean,
            required: true
        },
        withdraw_require_mfa: {
            type: Boolean,
            required: true
        },
        prime_transfer_fee: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        nft_commission_fee_rate: { type: Types.Decimal128, default: new Types.Decimal128('0') }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                ret.prime_transfer_fee = Number(ret.prime_transfer_fee)
                ret.nft_commission_fee_rate = Number(ret.nft_commission_fee_rate)
                return ret
            }
            // getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.settings
    }
)

export default model<ISetting>(config.database.tables.settings, settingSchema)
