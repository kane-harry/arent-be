import { config } from '@config'
import { randomBytes } from 'crypto'
import { Schema, Types, model } from 'mongoose'
import { IProduct, IProductImportLog } from './product.interface'

const productSchema = new Schema<IProduct>(
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

const ProductModel = model<IProduct>('products', productSchema)

const productImportLogSchema = new Schema<IProductImportLog>({
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

const ProductImportLogModel = model<IProductImportLog>('product_import_logs', productImportLogSchema)
export { ProductModel, ProductImportLogModel }
