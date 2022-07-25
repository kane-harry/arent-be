import { Schema, model } from 'mongoose'
import { IVerificationCode } from './code.interface'
import moment from 'moment'
import { generate, GenerateOptions } from 'randomstring'
import { config } from '@config'
import { randomBytes } from 'crypto'
import { CodeType } from '@config/constants'

const codeSchema = new Schema<IVerificationCode>(
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
        owner: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            index: true
        },
        user_key: String,
        type: {
            type: String,
            enum: CodeType,
            required: true
        },
        code: String,
        expiry_timestamp: {
            type: Number,
            default: () => {
                return moment().add(15, 'minutes').unix()
            }
        },
        sent_timestamp: {
            type: Number,
            default: () => {
                return moment().unix()
            }
        },
        sent_attempts: { type: Number, default: 0 },
        verified: { type: Boolean, default: false }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.verification_codes
    }
)

const VerificationCodeModel = model<IVerificationCode>(config.database.tables.verification_codes, codeSchema)

export class VerificationCode extends VerificationCodeModel {
    public static generate(options: GenerateOptions | number = { length: 6, charset: 'numeric' }) {
        return generate(options)
    }
}

export default VerificationCode
