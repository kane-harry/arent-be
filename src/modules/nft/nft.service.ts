import { IUser } from '@modules/user/user.interface'
import { CreateNftDto, ImportNftDto } from './nft.dto'
import { NftImportLogModel, NftModel } from './nft.model'
import { ICollection, ICollectionFilter } from '@modules/collection/collection.interface'
import { CollectionModel } from '@modules/collection/collection.model'
import { QueryRO } from '@interfaces/query.model'
import { INft, INftFilter } from '@modules/nft/nft.interface'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IUser) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        await model.save()
    }

    static async createNft(createNftDto: CreateNftDto, operator: IUser) {
        const model = new NftModel({
            ...createNftDto,
            creator: operator.key,
            owner: operator.key,
            on_market: false,
            status: 'Mint'
        })
        return await model.save()
    }

    static async queryNfts(params: INftFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms)
            filter.$or = [{ key: reg }, { name: reg }, { description: reg }, { title: reg }, { tags: reg }]
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await NftModel.countDocuments(filter)
        const items = await NftModel.find<INft>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<INft>(totalCount, params.page_index, params.page_size, items)
    }
}
