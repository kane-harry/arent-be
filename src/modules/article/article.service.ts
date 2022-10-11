import { ArticleType, ARTICLE_COVER_IMAGE_SIZES } from '@config/constants'
import { ArticleDto, ArticleRO } from './article.dto'
import BizException from '@exceptions/biz.exception'
import { ArticleErrors, AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter } from 'lodash'
import ArticleModel from './article.model'
import { isAdmin } from '@config/role'
import { IArticle, IArticleFilter } from './article.interface'
import { QueryRO } from '@interfaces/query.model'
import UserModel from '@modules/user/user.model'
import { IOperator } from '@interfaces/operator.interface'

export default class ArticleService {
    static async uploadContentFiles(files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined, user: IOperator) {
        const data = await uploadFiles(files, 'articles')
        return data
    }

    static async createArticle(params: ArticleDto, files: any, operator: IOperator) {
        // if (!files || !files.find((item: any) => item.fieldname === 'cover_image')) {
        //     throw new BizException(ArticleErrors.cover_image_required_error, new ErrorContext('article.service', 'createArticle', {}))
        // }
        // files = await resizeImages(files, { cover_image: ARTICLE_COVER_IMAGE_SIZES })
        // const assets = await uploadFiles(files, 'articles')

        // const images = filter(assets, asset => {
        //     return asset.fieldname === 'cover_image'
        // })
        // const originalImg = images.find(item => item.type === 'original')
        // const largeImg = images.find(item => item.type === 'large')
        // const mediumImg = images.find(item => item.type === 'medium')
        // const smallImg = images.find(item => item.type === 'small')
        // const cover_image = {
        //     original: originalImg?.key,
        //     large: largeImg?.key,
        //     medium: mediumImg?.key,
        //     small: smallImg?.key
        // }
        // const articleEntity = {
        //     key: undefined,
        //     nav_key: await ArticleModel.generateNavKey(params.title),
        //     title: params.title,
        //     tags: params.tags,
        //     type: params.type as ArticleType,
        //     short_description: params.short_description,
        //     content: params.content,
        //     cover_image: cover_image,
        //     author_key: operator.key,
        //     editor_key: operator.key
        // } as IArticle
        // const model = new ArticleModel(articleEntity)
        // const article = await model.save()
        // return article
        return {}
    }

    static async updateArticle(key: string, params: ArticleDto, files: any, operator: IOperator) {
        const article = await ArticleModel.findOne({ removed: false, $or: [{ key }, { nav_key: key }] })
        if (!article) {
            throw new BizException(ArticleErrors.item_not_found_error, new ErrorContext('article.service', 'updateArticle', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== article.author_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('article.controller', 'updateArticle', { key }))
        }
        if (files && files.length > 0) {
            files = await resizeImages(files, { cover_image: ARTICLE_COVER_IMAGE_SIZES })
            const assets = await uploadFiles(files, 'articles')

            const images = filter(assets, asset => {
                return asset.fieldname === 'cover_image'
            })
            const originalImg = images.find(item => item.type === 'original')
            const largeImg = images.find(item => item.type === 'large')
            const mediumImg = images.find(item => item.type === 'medium')
            const smallImg = images.find(item => item.type === 'small')
            const cover_image = {
                original: originalImg?.key,
                large: largeImg?.key,
                medium: mediumImg?.key,
                small: smallImg?.key
            }
            article.set('cover_image', cover_image, Object)
        }
        article.set('title', params.title, String)
        article.set('tags', params.tags, String)
        article.set('type', params.type, String)
        article.set('short_description', params.short_description, String)
        article.set('content', params.content, String)

        const updatedArticle = await article.save()

        return updatedArticle
    }

    static async deleteArticle(key: string, operator: IOperator) {
        const article = await ArticleModel.findOne({ $or: [{ key }, { nav_key: key }] })
        if (!article) {
            throw new BizException(ArticleErrors.item_not_found_error, new ErrorContext('article.service', 'deleteArticle', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== article.author_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('article.controller', 'deleteArticle', { key }))
        }
        article.set('removed', true, Boolean)
        return { success: true }
    }

    static async getArticleDetail(key: string) {
        const article = await ArticleModel.findOne({ $or: [{ key }, { nav_key: key }], removed: false })
        if (article) {
            const author = await UserModel.getBriefByKey(article.author_key, false)
            return new ArticleRO(article, author)
        }
        return article
    }

    static async retrieveArticles(params: IArticleFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms)
            filter.$or = [{ key: reg }, { title: reg }, { short_description: reg }, { content: reg }, { tags: reg }]
        }
        if (params.author) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ author_key: { $eq: params.author } })
        }
        if (params.type) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ type: { $eq: params.type } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await ArticleModel.countDocuments(filter)
        const items = await ArticleModel.find<IArticle>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<IArticle>(totalCount, params.page_index, params.page_size, items)
    }
}
