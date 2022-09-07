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
        description: String,
        external_link: String,
        collection_key: String,
        price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        royalty: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        currency: String,
        meta_data: { type: [Object], default: [] },
        animation: { type: Object, default: null },
        image: { type: Object, default: null },
        type: { type: String, default: 'erc721' },
        num_sales: Number,
        quantity: Number,
        creator_key: String,
        owner_key: String,
        attributes: { type: [Object], default: [] },
        on_market: Boolean,
        listing_date: { type: Date, default: null },
        last_sale: { type: Date, default: null },
        token_id: String,
        status: String,
        is_presale: Boolean,
        top_bid: { type: Object, default: null },
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
