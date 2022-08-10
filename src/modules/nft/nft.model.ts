import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, Types, model } from 'mongoose'
import { INft, INftImportLog } from './nft.interface'

const nftSchema = new Schema<INft>(
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
        name: String,
        title: String,
        description: String,
        tags: String,
        price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        currency: String,
        meta_data: { type: [Object], default: [] },
        videos: { type: [Object], default: [] },
        images: { type: [Object], default: [] },
        type: { type: String, default: 'erc721' },
        amount: Number,
        attributes: { type: [Object], default: [] },
        on_market: Boolean,
        creator: String,
        owner: String,
        nft_token_id: String,
        status: String,
        collection_key: String,
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                ret.price = ret.price.toString()
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.nfts
    }
)

const NftModel = model<INft>('nfts', nftSchema)

const nftImportLogSchema = new Schema<INftImportLog>({
    key: {
        type: String,
        required: true,
        index: true,
        unique: true,
        default: () => {
            return randomBytes(8).toString('hex')
        }
    },
    user_key: String,
    contract_address: String,
    token_id: String,
    type: String,
    platform: String,
    status: String,
    removed: { type: Boolean, default: false }
})

const NftImportLogModel = model<INftImportLog>('nft_import_logs', nftImportLogSchema)
export { NftModel, NftImportLogModel }
