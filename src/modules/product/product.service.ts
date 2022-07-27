import { IUser } from '@modules/user/user.interface'
import { ImportProductDto } from './product.dto'
import { IProduct, IProductImportLog } from './product.interface'
import { ProductImportLogModel, ProductModel } from './product.model'

export default class ProductService {
    static async importProduct(payload: ImportProductDto, operator: IUser) {
        const model = new ProductImportLogModel({
            ...payload,
            creator: operator.key
        })
        await model.save()
    }

    static async createProduct(payload: IProduct, operator: IUser) {
        const model = new ProductModel({
            ...payload
        })
        await model.save()
    }
}
