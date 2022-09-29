import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { IAdminLog } from './admin_log.interface'

const AdminLogsSchema = new Schema<IAdminLog>(
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
        operator: {
            type: Object,
            required: true
        },
        user_key: {
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
        pre_data: Object,
        post_data: Object
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                return ret
            }
        },
        versionKey: 'version',
        collection: config.database.tables.admin_logs
    }
)

const AdminLogModel = model<IAdminLog>(config.database.tables.admin_logs, AdminLogsSchema)

export default AdminLogModel
