import { ArticleType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface IArticle extends IBaseModel {
    nav_key: string
    title: string
    tags?: string
    type: ArticleType
    short_description?: string
    cover_image?: any
    content: string
    author_key: string
    editor_key: string
}

export interface IArticleFilter extends IFilterModel {
    terms?: string
    author?: string
    type?: string
}
