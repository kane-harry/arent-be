import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { ICollection } from './collection.interface'

const collectionSchema = new Schema<ICollection>(
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
        category_key: String,
        creator_key: String,
        owner_key: String,
        logo: { type: Object, default: null },
        background: { type: Object, default: null },
        type: { type: String, default: 'normal' },
        items_count: Number,
        analytics: { type: Object, default: null },
        featured: { type: Boolean, default: false },
        website: String,
        discord: String,
        instagram: String,
        twitter: String,
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

export { CollectionModel }
