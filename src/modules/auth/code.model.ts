import { Schema, model } from 'mongoose'
import { IVerificationCode } from './code.interface'
import moment from 'moment'

const codeSchema = new Schema<IVerificationCode>(
    {
        owner: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            index: true
        },
        type: String,
        code: String,
        expiryTimestamp: { type: Number, default: moment().add(15, 'minutes').unix() },
        sentTimestamp: { type: Number, default: moment().unix() },
        retryAttempts: { type: Number, default: 0 },
        sentAttempts: { type: Number, default: 1 },
        enabled: { type: Boolean, default: true }
        // created: { type: Date, default: Date.now },
        // modified: { type: Date, default: Date.now }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        }
    }
)

const VerificationCodeModel = model<IVerificationCode>('verification_codes', codeSchema)

export default VerificationCodeModel
