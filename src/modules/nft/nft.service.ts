import { IUser } from '@modules/user/user.interface'
import { CreateNftDto, ImportNftDto, UpdateNftDto } from './nft.dto'
import { NftImportLogModel, NftModel } from './nft.model'
import { ICollection, ICollectionFilter } from '@modules/collection/collection.interface'
import { CollectionModel } from '@modules/collection/collection.model'
import { QueryRO } from '@interfaces/query.model'
import { INft, INftFilter } from '@modules/nft/nft.interface'
import BizException from '@exceptions/biz.exception'
import { AccountErrors, AuthErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin } from '@config/role'
import UserService from '@modules/user/user.service'
import { NftStatus } from '@config/constants'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IUser) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        await model.save()
    }

    static async createNft(createNftDto: CreateNftDto, operator: IUser) {
        // @ts-ignore
        if (!createNftDto.image || !createNftDto.image.normal || !createNftDto.image.thumb) {
            throw new BizException(NftErrors.nft_image_error, new ErrorContext('nft.service', 'createNft', { image: createNftDto.image }))
        }

        const model = new NftModel({
            ...createNftDto,
            status: NftStatus.Pending,
            creator: operator.key,
            owner: operator.key,
            on_market: false
        })
        const nft = await model.save()
        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: 1 } }, { new: true }).exec()

        return nft
    }

    static async queryNfts(params: INftFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms)
            filter.$or = [{ key: reg }, { name: reg }, { description: reg }, { title: reg }, { tags: reg }]
        }
        if (params.owner) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ owner: { $eq: params.owner } })
        }
        if (params.price_min) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ price: { $gte: params.price_min } })
        }
        if (params.price_max) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ price: { $lte: params.price_max } })
        }
        if (params.collection_key) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ collection_key: { $eq: params.collection_key } })
        }
        if (params.on_market) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ on_market: { $eq: params.on_market } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await NftModel.countDocuments(filter)
        const items = await NftModel.find<INft>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<INft>(totalCount, params.page_index, params.page_size, items)
    }

    static async updateNft(key: string, updateNftDto: UpdateNftDto, operator: IUser) {
        const nft = await NftModel.findOne({ key, owner: operator.key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('account.service', 'initAccounts', { key }))
        }
        nft.set('owner', updateNftDto.owner ?? nft.owner, String)
        nft.set('status', updateNftDto.status ?? nft.status, String)
        nft.set('on_market', updateNftDto.on_market ?? nft.on_market, String)
        nft.set('name', updateNftDto.name ?? nft.name, String)
        nft.set('title', updateNftDto.title ?? nft.title, String)
        nft.set('description', updateNftDto.description ?? nft.description, String)
        nft.set('tags', updateNftDto.tags ?? nft.tags, String)
        nft.set('price', updateNftDto.price ?? nft.price, String)
        nft.set('nft_token_id', updateNftDto.nft_token_id ?? nft.nft_token_id, String)
        nft.set('attributes', updateNftDto.attributes ?? nft.attributes, Array)
        nft.set('metadata', updateNftDto.metadata ?? nft.metadata, Array)
        nft.set('collection_key', updateNftDto.collection_key ?? nft.collection_key, String)
        return await nft.save()
    }

    static async deleteNft(key: string, operator: IUser) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== nft.owner) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        nft.set('owner', '00000000000000000000000000000000', String)
        nft.set('removed', true, Boolean)
        await nft.save()

        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: -1 } }, { new: true }).exec()

        return nft
    }

    static async getNftDetail(key: string) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'getNFTDetail', { key }))
        }
        const owner = await UserService.getBriefByKey(nft.owner)
        return { nft, owner }
    }
}
