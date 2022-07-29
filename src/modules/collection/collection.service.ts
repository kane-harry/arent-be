import { IUser } from '@modules/user/user.interface'
import { CreateCollectionDto } from './collection.dto'
import { CollectionModel } from './collection.model'

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
}
