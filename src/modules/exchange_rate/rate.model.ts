import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, Types, model } from 'mongoose'
import { IRate, IRateLog } from './rate.interface'

const rateSchema = new Schema<IRate>(
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
        symbol: String,
        rate: Number
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
        versionKey: 'version'
    }
)

const rateLogSchema = new Schema<IRateLog>(
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
        symbol: String,
        rate: Number,
        provider: {
            type: String,
            default: 'LightLink'
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

const RateModel = model<IRate>('rates', rateSchema)
const RateLogModel = model<IRateLog>('rate_logs', rateLogSchema)

export { RateModel, RateLogModel }
