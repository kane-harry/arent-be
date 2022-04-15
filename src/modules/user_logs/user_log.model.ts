import { Schema, model } from 'mongoose'
import { IUserLog } from './user_log.interface'

const userLogSchema = new Schema<IUserLog>(
    {
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
        old_data: Object,
        new_data: Object
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        }
    }
)

export default model<IUserLog>('user_logs', userLogSchema)
