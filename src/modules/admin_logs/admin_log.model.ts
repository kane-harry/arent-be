import { Schema, model } from 'mongoose'
import { IAdminLog } from './admin_log.interface'

const AdminLogsSchema = new Schema<IAdminLog>(
    {
        key: { type: String, required: true, index: true, unique: true },
        operator: {
            type: Object,
            required: true
        },
        userKey: {
            type: String
        },
        section: {
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

export default model<IAdminLog>('admin_logs', AdminLogsSchema)
