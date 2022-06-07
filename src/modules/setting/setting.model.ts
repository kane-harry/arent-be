import { Schema, Types, model } from 'mongoose'
import { ISetting } from './setting.interface'

const settingSchema = new Schema<ISetting>(
    {
        registrationRequireEmailVerified: {
            type: Boolean,
            required: true
        },
        registrationRequirePhoneVerified: {
            type: Boolean,
            required: true
        },
        loginRequireMFA: {
            type: Boolean,
            required: true
        },
        withdrawRequireMFA: {
            type: Boolean,
            required: true
        },
        primeTransferFee: { type: Types.Decimal128, default: new Types.Decimal128('0') }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                ret.primeTransferFee = ret.primeTransferFee.toString()
                return ret
            }
            // getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

export default model<ISetting>('settings', settingSchema)