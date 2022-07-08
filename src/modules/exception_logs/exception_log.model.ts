import { Schema, model } from 'mongoose'
import { IExceptionLog } from './exception_log.interface'

const exceptionLogsSchema = new Schema<IExceptionLog>(
    {
        key: { type: String, required: true, index: true, unique: true },
        ipAddress: {
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
        versionKey: 'version'
    }
)

export default model<IExceptionLog>('exception_logs', exceptionLogsSchema)
