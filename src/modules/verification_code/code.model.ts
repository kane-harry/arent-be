import { Schema, model } from 'mongoose'
import { IVerificationCode, CodeType } from './code.interface'
import moment from 'moment'
import { generate, GenerateOptions } from 'randomstring'

const codeSchema = new Schema<IVerificationCode>(
    {
        owner: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: CodeType,
            required: true
        },
        code: String,
        expiryTimestamp: { type: Number, default: moment().add(15, 'minutes').unix() },
        sentTimestamp: { type: Number, default: moment().unix() },
        retryAttempts: { type: Number, default: 0 },
        sentAttempts: { type: Number, default: 1 },
        enabled: { type: Boolean, default: true }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const VerificationCodeModel = model<IVerificationCode>('verification_codes', codeSchema)

export class VerificationCode extends VerificationCodeModel {
    public static generate(options: GenerateOptions | number = { length: 6, charset: 'numeric' }) {
        return generate(options)
    }
}
