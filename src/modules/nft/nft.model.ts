import { config } from '@config'
import { randomBytes } from 'crypto'
import { model, Schema, Types } from 'mongoose'
import { INft, INftBidLog, INftImportLog, INftOwnershipLog, INftSaleLog, INftOffer } from './nft.interface'

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
        platform: { type: String, default: config.system.nftDefaultPlatform },
        external_link: String,
        collection_key: String,
        price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        royalty: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        currency: String,
        meta_data: { type: [Object], default: [] },
        animation: { type: Object, default: null },
        image: { type: Object, default: null },
        type: { type: String, default: 'erc721' },
        price_type: { type: String, default: 'fixed' },
        auction_start: Number,
        auction_end: Number,
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
        featured: Boolean,
        number_of_likes: Number,
        top_bid: { type: Object, default: null },
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                ret.price = ret.price.toString()
                ret.royalty = ret.royalty.toString()
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

const nftImportLogSchema = new Schema<INftImportLog>(
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
        user_key: String,
        contract_address: String,
        token_id: String,
        type: String,
        platform: String,
        status: String,
        removed: { type: Boolean, default: false }
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

const NftImportLogModel = model<INftImportLog>('nft_import_logs', nftImportLogSchema)

const nftOwnershipLogSchema = new Schema<INftOwnershipLog>(
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
        nft_key: String,
        collection_key: String,
        price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        currency: String,
        previous_owner: Object,
        current_owner: Object,
        type: String,
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                ret.price = parseFloat(ret.price.toString())
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const NftOwnershipLogModel = model<INftOwnershipLog>('nft_ownership_logs', nftOwnershipLogSchema)

const nftSaleLogSchema = new Schema<INftSaleLog>(
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
        nft_key: String,
        collection_key: String,
        unit_price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        currency: String,
        order_value: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        commission_fee: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        royalty_fee: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        quantity: Number,
        seller: Object,
        buyer: Object,
        secondary_market: Boolean,
        details: Object,
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                ret.unit_price = parseFloat(ret.unit_price.toString())
                ret.order_value = parseFloat(ret.order_value.toString())
                ret.commission_fee = parseFloat(ret.commission_fee.toString())
                ret.royalty_fee = parseFloat(ret.royalty_fee.toString())
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const NftSaleLogModel = model<INftSaleLog>('nft_sale_logs', nftSaleLogSchema)

const nftBidLogSchema = new Schema<INftBidLog>(
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
        nft_key: String,
        collection_key: String,
        currency: String,
        price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        user: Object,
        secondary_market: Boolean,
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                ret.price = parseFloat(ret.price.toString())
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const NftBidLogModel = model<INftBidLog>('nft_bid_logs', nftBidLogSchema)

const nftOfferSchema = new Schema<INftOffer>(
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
        status: String,
        user_key: String,
        nft_key: String,
        collection_key: String,
        currency: String,
        price: { type: Types.Decimal128, default: new Types.Decimal128('0') },
        user: Object,
        secondary_market: Boolean,
        removed: { type: Boolean, default: false }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                ret.price = parseFloat(ret.price.toString())
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const NftOfferModel = model<INftOffer>('nft_offers', nftOfferSchema)

export { NftModel, NftImportLogModel, NftOwnershipLogModel, NftSaleLogModel, NftBidLogModel, NftOfferModel }
