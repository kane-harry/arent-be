import BizException from '@exceptions/biz.exception'
import { CategoryErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { CategoryDto } from './category.dto'
import { ICategory } from './category.interface'
import { CategoryModel } from './category.model'

export default class CategoryService {
    static async createCategory(params: CategoryDto) {
        const item = await CategoryModel.findOne({ name: params.name })
        if (item) {
            throw new BizException(
                CategoryErrors.category_name_exists_error,
                new ErrorContext('category.service', 'createCategory', { name: params.name })
            )
        }

        const model = new CategoryModel({
            key: undefined,
            nav_key: await CategoryModel.generateNavKey(params.name),
            ...params
        })
        const data = await model.save()
        return data
    }

    static async updateCategory(key: string, params: CategoryDto) {
        const item = await CategoryModel.findOne({ $or: [{ key }, { nav_key: key }] })
        if (!item) {
            throw new BizException(CategoryErrors.item_not_found_error, new ErrorContext('category.service', 'updateCategory', { key }))
        }
        item.set('name', params.name, String)
        item.set('description', params.description, String)

        const updated = await item.save()
        return updated
    }

    static async deleteCategory(key: string) {
        await CategoryModel.findOneAndRemove({ $or: [{ key }, { nav_key: key }] })
        return { success: true }
    }

    static async getCategory(key: string) {
        return await CategoryModel.findOne({ $or: [{ key }, { nav_key: key }], removed: false })
    }

    static async getCategories() {
        const items = await CategoryModel.find<ICategory>({ removed: false }).sort({ name: 1 }).exec()
        return items
    }
}
