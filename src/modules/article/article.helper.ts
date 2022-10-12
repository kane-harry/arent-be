import UserService from '@modules/user/user.service'
import { find, uniq } from 'lodash'
import { IArticle } from '@modules/article/article.interface'

export default class ArticleHelper {
    static async formatArticleRO(article: IArticle) {
        const author = await UserService.getBriefByKey(article.author_key)
        const editor = await UserService.getBriefByKey(article.editor_key)
        const result: any = {
            key: article.key,
            title: article.title,
            tags: article.tags,
            type: article.type,
            short_description: article.short_description,
            cover_image: article.cover_image,
            content: article.content,
            author,
            editor
        }
        return result
    }

    static async formatArticleListRO(articles: IArticle[]) {
        const author_keys = articles.map(p => p.author_key)
        const editor_keys = articles.map(p => p.editor_key)
        const user_keys = uniq(author_keys.concat(editor_keys))
        const users = await UserService.getBriefByKeys(user_keys)

        const result = articles.map(article => {
            const author = find(users, { key: article.author_key })
            const editor = find(users, { key: article.editor_key })
            return {
                key: article.key,
                title: article.title,
                tags: article.tags,
                type: article.type,
                short_description: article.short_description,
                cover_image: article.cover_image,
                content: article.content,
                author,
                editor
            }
        })
        return result
    }
}
