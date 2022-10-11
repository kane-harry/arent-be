import { IsOptional, IsNotEmpty, IsEnum, IsString } from 'class-validator'
import { ArticleType } from '@config/constants'
import { map } from 'lodash'
import { IUser } from '@modules/user/user.interface'
import { IArticle } from './article.interface'

export class ArticleDto {
    @IsNotEmpty()
    public title: string

    @IsOptional()
    public tags: string

    @IsString()
    @IsEnum(ArticleType, {
        message: `Article type must be one of ${map(ArticleType, el => el).join(' ')}`
    })
    public type: ArticleType

    @IsNotEmpty()
    public short_description: string

    @IsNotEmpty()
    public content: string
}

export class ArticleRO {
    key?: string
    title: string
    tags?: string
    type: string
    short_description?: string
    cover_image?: object
    content: string
    author: object
    created: Date
    modified: Date
    constructor(article: IArticle, author: IUser | undefined | null) {
        this.key = article.key
        this.title = article.title
        this.tags = article.tags
        this.type = article.type
        this.short_description = article.short_description
        this.cover_image = article.cover_image
        this.content = article.content
        this.author = { key: author?.key, chat_name: author?.chat_name, avatar: author?.avatar }
    }
}
