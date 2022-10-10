import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { requireAuth } from '@utils/authCheck'

import CategoryController from './category.controller'
import { requireAdmin } from '@config/role'
import { CategoryDto } from './category.dto'

export default class CategoryRouter implements ICustomRouter {
    public path = '/categories'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(
            `${this.path}`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(CategoryDto),
            asyncHandler(CategoryController.createCategory)
        )
        this.router.get(`${this.path}/`, asyncHandler(CategoryController.getCategories))
        this.router.get(`${this.path}/:key`, asyncHandler(CategoryController.getCategory))
        this.router.put(
            `${this.path}/:key`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(CategoryDto),
            asyncHandler(CategoryController.updateCategory)
        )
        this.router.delete(`${this.path}/:key`, requireAuth, requireAdmin(), asyncHandler(CategoryController.deleteCategory))
    }
}
