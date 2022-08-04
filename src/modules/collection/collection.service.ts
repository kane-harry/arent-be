import { IUser } from '@modules/user/user.interface'
import { CreateCollectionDto } from './collection.dto'
import { CollectionModel } from './collection.model'
import { ICollection, ICollectionFilter } from '@modules/collection/collection.interface'
import { QueryRO } from '@interfaces/query.model'

export default class CollectionService {
    static async createCollection(createCollectionDto: CreateCollectionDto, operator: IUser) {
        const model = new CollectionModel({
            ...createCollectionDto,
            creator: operator.key,
            owner: operator.key,
            items_count: 0
        })
        return await model.save()
    }

    static async queryCollections(params: ICollectionFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms)
            filter.$or = [{ key: reg }, { name: reg }, { description: reg }, { type: reg }]
        }
        if (params.owner) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ owner: { $eq: params.owner } })
        }
        if (!params.include_all) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ items_count: { $gte: 0 } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await CollectionModel.countDocuments(filter)
        const items = await CollectionModel.find<ICollection>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<ICollection>(totalCount, params.page_index, params.page_size, items)
    }
}
