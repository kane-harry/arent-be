import { Response } from 'express'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { CategoryDto } from './category.dto'
import CategoryService from './category.service'

export default class CategoryController {
    static async createCategory(req: AuthenticationRequest, res: Response) {
        const params: CategoryDto = req.body
        const data = await CategoryService.createCategory(params)
        return res.send(data)
    }

    static async getCategories(req: CustomRequest, res: Response) {
        const data = await CategoryService.getCategories()
        return res.json(data)
    }

    static async getCategory(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const data = await CategoryService.getCategory(key)
        return res.json(data)
    }

    static async updateCategory(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: CategoryDto = req.body
        const data = await CategoryService.updateCategory(key, params)
        return res.json(data)
    }

    static async deleteCategory(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const collection = await CategoryService.deleteCategory(key)
        return res.json(collection)
    }
}
