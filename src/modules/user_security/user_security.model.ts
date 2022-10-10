import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { IUserSecurity } from './user_security.interface'

const userSecuritySchema = new Schema<IUserSecurity>(
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
        user_key: {
            type: String,
            required: true
        },
        ip_address: {
            type: String,
            required: true
        },
        agent: {
            type: String,
            required: true
        },
        action: {
            type: String,
            required: true
        },
        pre_data: Object,
        post_data: Object
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
        collection: config.database.tables.user_security
    }
)

export default model<IUserSecurity>(config.database.tables.user_security, userSecuritySchema)
