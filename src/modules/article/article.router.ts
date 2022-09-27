import asyncHandler from '@utils/asyncHandler'
import { requireAuth } from '@utils/authCheck'
import { Router } from 'express'
import validationMiddleware from '@middlewares/validation.middleware'
import { ArticleDto } from './article.dto'
import { requireAdmin } from '@config/role'
import Multer from 'multer'
import ICustomRouter from '@interfaces/custom.router.interface'
import ArticleController from '@modules/article/article.controller'

const upload = Multer()

export default class ArticleRouter implements ICustomRouter {
    public path = '/articles'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}`,
            requireAuth,
            requireAdmin(),
            upload.any(),
            validationMiddleware(ArticleDto),
            asyncHandler(ArticleController.createArticle)
        )
        this.router.get(`${this.path}`, asyncHandler(ArticleController.retrieveArticles))
        this.router.put(
            `${this.path}/:key`,
            requireAuth,
            requireAdmin(),
            upload.any(),
            validationMiddleware(ArticleDto),
            asyncHandler(ArticleController.updateArticle)
        )
        this.router.get(`${this.path}/:key`, asyncHandler(ArticleController.getArticleDetail))
        this.router.delete(`${this.path}/:key`, requireAuth, requireAdmin(), asyncHandler(ArticleController.deleteArticle))
        this.router.post(`${this.path}/files/upload`, requireAuth, upload.any(), asyncHandler(ArticleController.uploadContentFiles))
    }
}
