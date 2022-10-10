import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { INftHistory } from './nft_history.interface'

const nftHistorySchema = new Schema<INftHistory>(
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
        nft_key: {
            type: String,
            required: true
        },
        operator: {
            type: Object
        },
        options: {
            type: Object
        },
        action: {
            type: String,
            required: true
        },
        pre_data: Object,
        post_data: Object
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
        versionKey: 'version',
        collection: config.database.tables.nft_history
    }
)

const NftHistoryModel = model<INftHistory>(config.database.tables.nft_history, nftHistorySchema)
export default NftHistoryModel
