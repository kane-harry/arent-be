import { config } from '@config'
import { CollectionType } from '@config/constants'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { ICollection, ICollectionRanking } from './collection.interface'

const collectionSchema = new Schema<ICollection>(
    {
        key: {
            type: String,
            required: true,
            index: true,
            unique: true,
            default: () => {
                return randomBytes(10).toString('hex')
            }
        },
        name: String,
        description: String,
        category_key: String,
        creator_key: String,
        owner_key: String,
        logo: { type: Object, default: null },
        background: { type: Object, default: null },
        type: { type: String, enum: CollectionType, default: CollectionType.Normal },
        attributes: { type: [Object], default: [] },
        items_count: Number,
        featured: { type: Boolean, default: false },
        website: String,
        discord: String,
        instagram: String,
        twitter: String,
        ranking: { type: Object, default: null },
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
        versionKey: 'version',
        collection: config.database.tables.collections
    }
)

const CollectionModel = model<ICollection>('collections', collectionSchema)

const collectionRankingSchema = new Schema<ICollectionRanking>(
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
        collection_key: String,
        market_price: Number,
        number_of_owners: Number,
        trading_volume: Number,
        trading_volume_24hrs: Number,
        number_of_orders_24hrs: Number,
        number_of_items: Number,
        item_average_price: Number,
        item_floor_price: Number,
        item_celling_price: Number,
        number_of_orders: Number,
        order_average_price: Number,
        order_floor_price: Number,
        order_celling_price: Number,
        updated: Date
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
const CollectionRankingModel = model<ICollectionRanking>('collection_rankings', collectionRankingSchema)

export { CollectionModel, CollectionRankingModel }
