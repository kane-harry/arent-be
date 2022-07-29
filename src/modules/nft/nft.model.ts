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
        image: Object,
        images: { type: [Object], default: [] },
        attributes: { type: [Object], default: [] },

        creator: String,
        owner: String,
        status: String,
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.users
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
