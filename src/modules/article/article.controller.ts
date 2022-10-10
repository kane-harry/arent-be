import { Request, Response } from 'express'
import { ArticleDto } from './article.dto'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import ArticleService from './article.service'
import { IArticleFilter } from './article.interface'

export default class ArticleController {
    static async uploadContentFiles(req: AuthenticationRequest, res: Response) {
        const files = req.files
        const data = await ArticleService.uploadContentFiles(files, req.user)
        return res.json(data)
    }

    static async createArticle(req: AuthenticationRequest, res: Response) {
        const params: ArticleDto = req.body
        const files = req.files
        const data = await ArticleService.createArticle(params, files, req.user)
        return res.json(data)
    }

    static async updateArticle(req: AuthenticationRequest, res: Response) {
        const key: string = req.params.key
        const params: ArticleDto = req.body
        const files = req.files
        const data = await ArticleService.updateArticle(key, params, files, req.user)
        return res.json(data)
    }

    static async getArticleDetail(req: Request, res: Response) {
        const key: string = req.params.key
        const data = await ArticleService.getArticleDetail(key)
        return res.json(data)
    }

    static async deleteArticle(req: AuthenticationRequest, res: Response) {
        const key: string = req.params.key
        const data = await ArticleService.deleteArticle(key, req.user)
        return res.json(data)
    }

    static async retrieveArticles(req: CustomRequest, res: Response) {
        const filter = req.query as IArticleFilter
        const data = await ArticleService.retrieveArticles(filter)
        return res.json(data)
    }
}
