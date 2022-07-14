import { Schema, model } from 'mongoose'
import { IUserHistory } from './user_history.interface'

const userHistorySchema = new Schema<IUserHistory>(
    {
        key: { type: String, required: true, index: true, unique: true },
        userKey: {
            type: String,
            required: true
        },
        ipAddress: {
            type: String,
            required: true
        },
        country: {
            type: String
        },
        agent: {
            type: String,
        },
        action: {
            type: String,
            required: true
        },
        preData: Object,
        postData: Object
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

export default model<IUserHistory>('user_history', userHistorySchema)
