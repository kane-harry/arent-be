import { IUser } from '@modules/user/user.interface'
import { CreateNftDto, ImportNftDto, NftRO, UpdateNftDto, UpdateNftStatusDto } from './nft.dto'
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
import { NftHistoryActions, NftStatus, MASTER_ACCOUNT_KEY, NftType, NFT_IMAGE_SIZES } from '@config/constants'
import NftHistoryModel from '@modules/nft_history/nft_history.model'
import CollectionService from '@modules/collection/collection.service'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter } from 'lodash'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IUser) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        return await model.save()
    }

    static async createNft(createNftDto: CreateNftDto, files: any, operator: IUser, options: any) {
        if (!files || !files.find((item: any) => item.fieldname === 'image')) {
            throw new BizException(NftErrors.nft_image_required_error, new ErrorContext('nft.service', 'createNft', {}))
        }
        files = await resizeImages(files, { image: NFT_IMAGE_SIZES })
        const assets = await uploadFiles(files, 'nfts')

        const images = filter(assets, asset => {
            return asset.fieldname === 'image'
        })
        const originalImg = images.find(item => item.type === 'original')
        const largeImg = images.find(item => item.type === 'large')
        const normalImg = images.find(item => item.type === 'normal')
        const smallImg = images.find(item => item.type === 'small')
        const image = {
            original: originalImg?.key,
            large: largeImg?.key,
            normal: normalImg?.key,
            small: smallImg?.key
        }
        const animationResp = assets.find(asset => {
            return asset.fieldname === 'animation'
        })
        const animation = animationResp?.key

        const model = new NftModel({
            ...createNftDto,
            image: image,
            animation: animation,
            status: isAdmin(operator.role) ? NftStatus.Approved : NftStatus.Pending,
            creator_key: operator.key,
            owner_key: isAdmin(operator.role) ? MASTER_ACCOUNT_KEY : operator.key,
            on_market: false
        })
        const nft = await model.save()
        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: 1 } }, { new: true }).exec()

        // create log
        await new NftHistoryModel({
            user_key: operator.key,
            action: NftHistoryActions.Create,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: null,
            post_data: nft.toString()
        }).save()

        return nft
    }

    static async queryNfts(params: INftFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = {}
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms)
            filter.$or = [{ key: reg }, { name: reg }, { description: reg }, { type: reg }, { status: reg }]
        }
        if (params.owner_key) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ owner_key: { $eq: params.owner_key } })
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

    static async updateNft(key: string, updateNftDto: UpdateNftDto, operator: IUser, options: any) {
        const nft = await NftModel.findOne({ key, owner: operator.key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('account.service', 'initAccounts', { key }))
        }
        const preNft = nft
        nft.set('name', updateNftDto.name ?? nft.name, String)
        nft.set('description', updateNftDto.description ?? nft.description, String)
        nft.set('price', updateNftDto.price ?? nft.price, String)
        nft.set('attributes', updateNftDto.attributes ?? nft.attributes, Array)
        nft.set('meta_data', updateNftDto.meta_data ?? nft.meta_data, Array)
        nft.set('collection_key', updateNftDto.collection_key ?? nft.collection_key, String)
        nft.set('quantity', updateNftDto.quantity ?? nft.quantity, Number)

        const updateNft = await nft.save()

        // create log
        await new NftHistoryModel({
            user_key: operator.key,
            action: NftHistoryActions.Update,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: preNft.toString(),
            post_data: updateNft.toString()
        }).save()

        return updateNft
    }

    static async updateNftStatus(key: string, updateNftStatusDto: UpdateNftStatusDto, operator: IUser, options: any) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('account.service', 'updateNftStatus', { key }))
        }
        const preNft = nft
        nft.set('status', updateNftStatusDto.status ?? nft.status, String)

        const updateNft = await nft.save()

        // create log
        await new NftHistoryModel({
            user_key: operator.key,
            action: NftHistoryActions.UpdateStatus,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: { status: preNft.status },
            post_data: { status: updateNft.status }
        }).save()

        return updateNft
    }

    static async deleteNft(key: string, operator: IUser, options: any) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== nft.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        const preNft = nft
        nft.set('owner_key', '00000000000000000000000000000000', String)
        nft.set('removed', true, Boolean)
        const updateNft = await nft.save()

        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: -1 } }, { new: true }).exec()
        // create log
        await new NftHistoryModel({
            user_key: operator.key,
            action: NftHistoryActions.Delete,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: preNft.toString(),
            post_data: updateNft.toString()
        }).save()

        return updateNft
    }

    static async getNftDetail(key: string) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'getNFTDetail', { key }))
        }
        const owner = await UserService.getBriefByKey(nft.owner_key)
        const creator = await UserService.getBriefByKey(nft.creator_key)
        const collectionDetail = await CollectionService.getCollectionDetail(nft.collection_key)
        return new NftRO<INft>(nft, owner, creator, collectionDetail.collection)
    }
}
