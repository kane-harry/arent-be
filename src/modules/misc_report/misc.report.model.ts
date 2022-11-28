import { config } from '@config'
import { MiscReportStatus, MiscReportType } from '@config/constants'
import { randomBytes } from 'crypto'
import { model, Schema } from 'mongoose'
import { IMiscReport } from './misc.report.interface'

const miscReportSchema = new Schema<IMiscReport>(
    {
        key: {
            type: String,
            required: true,
            index: true,
            unique: true,
            default: () => {
                return randomBytes(8).toString('hex')
            }
        },
        type: { type: String, enum: MiscReportType, default: MiscReportType.Bug },
        status: { type: String, enum: MiscReportStatus, default: MiscReportStatus.Pending },
        description: String,
        video: { type: Array, default: [] },
        images: { type: Array, default: [] },
        data: String,
        replay: String,
        submitter: { type: Object, default: null },
        worker: { type: Object, default: null },
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                delete ret.version
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.misc_reports
    }
)

const MiscReportModel = model<IMiscReport>('misc_reports', miscReportSchema)

export { MiscReportModel }
