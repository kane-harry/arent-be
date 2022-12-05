import { randomBytes } from 'crypto'
import { model, Schema } from 'mongoose'
import { IRate, IRateLog, ITokenCandle } from './rate.interface'

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

const tokenCandleSchema = new Schema<ITokenCandle>(
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
        type: String,
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
const TokenCandleModel = model<ITokenCandle>('token_candles', tokenCandleSchema)

export { RateModel, RateLogModel, TokenCandleModel }
