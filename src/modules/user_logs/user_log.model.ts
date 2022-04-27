import { Schema, model } from 'mongoose'
import { IUserLog } from './user_log.interface'

const userLogSchema = new Schema<IUserLog>(
    {
        userId: {
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
        oldData: Object,
        newData: Object
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
