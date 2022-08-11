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
        creator: String,
        owner: String,
        logo: { type: Object, default: null },
        background: { type: Object, default: null },
        type: { type: String, default: 'normal' },
        items_count: Number,
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
        collection: config.database.tables.collections
    }
)

const CollectionModel = model<ICollection>('collections', collectionSchema)

export { CollectionModel }
