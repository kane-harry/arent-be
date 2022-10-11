import { config } from '@config'
import { generateRandomCode } from '@utils/utility'
import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { ICategory } from './category.interface'

const categorySchema = new Schema<ICategory>(
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
        nav_key: String,
        name: String,
        description: String,
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

const _CategoryModel = model<ICategory>('categories', categorySchema)

class CategoryModel extends _CategoryModel {
    public static async generateNavKey(name: string) {
        let nav_key: string = name.toLowerCase().split(' ').join('-')
        const filter = { nav_key: nav_key }
        let referenceInDatabase = await this.findOne(filter).select('key nav_key').exec()

        while (referenceInDatabase != null) {
            nav_key = nav_key + '-' + generateRandomCode(2, 4, true).toLowerCase()
            filter.nav_key = nav_key
            referenceInDatabase = await this.findOne(filter).select('key nav_key').exec()
        }
        return nav_key
    }
}

export { CategoryModel }
