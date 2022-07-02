import { Schema, model } from 'mongoose'
import { IUserLog } from './user_log.interface'

const userLogSchema = new Schema<IUserLog>(
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
        agent: {
            type: String,
            required: true
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

export default model<IUserLog>('user_logs', userLogSchema)
