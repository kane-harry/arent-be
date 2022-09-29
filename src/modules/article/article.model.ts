import { Schema, model } from 'mongoose'
import { randomBytes } from 'crypto'
import { IArticle } from './article.interface'
import { ArticleType } from '@config/constants'

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

const ArticleModel = model<IArticle>('articles', articleSchema)

export default ArticleModel
