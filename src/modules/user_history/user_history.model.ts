import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { IUserHistory } from './user_history.interface'

const userHistorySchema = new Schema<IUserHistory>(
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
        operator: Object,
        options: Object,
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
        collection: config.database.tables.user_history
    }
)

export default model<IUserHistory>(config.database.tables.user_history, userHistorySchema)
