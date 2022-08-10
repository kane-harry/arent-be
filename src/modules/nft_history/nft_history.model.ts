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
        user_key: {
            type: String,
            required: true
        },
        ip_address: {
            type: String,
            required: true
        },
        country: {
            type: String
        },
        agent: {
            type: String
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
        versionKey: 'version',
        collection: config.database.tables.nft_history
    }
)

const NftHistoryModel = model<INftHistory>(config.database.tables.nft_history, nftHistorySchema)
export default NftHistoryModel
