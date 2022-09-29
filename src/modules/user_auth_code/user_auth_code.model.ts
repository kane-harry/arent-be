import { Schema, model } from 'mongoose'
import moment from 'moment'
import { generate, GenerateOptions } from 'randomstring'
import { config } from '@config'
import { randomBytes } from 'crypto'
import { CodeType } from '@config/constants'
import { IUserAuthCode } from '@modules/user_auth_code/user_auth_code.interface'

const codeSchema = new Schema<IUserAuthCode>(
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
        type: {
            type: String,
            enum: CodeType,
            required: true
        },
        code: String,
        sent_timestamp: {
            type: Number,
            default: () => {
                return moment().unix()
            }
        },
        expiry_timestamp: {
            type: Number,
            default: () => {
                return moment().add(15, 'minutes').unix()
            }
        },
        enabled: { type: Boolean, default: false },
        sent_attempts: { type: Number, default: 0 }
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                return ret
            },
            virtuals: true,
            getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.user_auth_codes
    }
)

const UserAuthCodeModel = model<IUserAuthCode>(config.database.tables.user_auth_codes, codeSchema)

export class UserAuthCode extends UserAuthCodeModel {
    public static generate(options: GenerateOptions | number = { length: 6, charset: 'numeric' }) {
        return generate(options)
    }
}

export default UserAuthCode
