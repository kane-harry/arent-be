import { Schema, model } from 'mongoose'
import { randomBytes } from 'crypto'
import { IArticle } from './article.interface'
import { ArticleType } from '@config/constants'
import { generateRandomCode } from '@utils/utility'

const articleSchema = new Schema<IArticle>(
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
        title: String,
        tags: String,
        type: {
            type: String,
            enum: ArticleType,
            required: true
        },
        short_description: String,
        cover_image: { type: Object, default: null },
        content: String,
        author_key: String,
        editor_key: String
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
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

const _ArticleModel = model<IArticle>('articles', articleSchema)

class ArticleModel extends _ArticleModel {
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

export default ArticleModel
