import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { IExceptionLog } from './exception_log.interface'

const exceptionLogsSchema = new Schema<IExceptionLog>(
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
        ip_address: {
            type: String,
            required: true
        },
        agent: {
            type: String,
            required: true
        },
        exception: {
            type: Object
        }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.exception_logs
    }
)

export default model<IExceptionLog>(config.database.tables.exception_logs, exceptionLogsSchema)
