import { IUser } from '@modules/user/user.interface'
import { AssignCollectionDto, CreateCollectionDto, UpdateCollectionDto } from './collection.dto'
import { CollectionModel } from './collection.model'
import { ICollection, ICollectionFilter } from '@modules/collection/collection.interface'
import { QueryRO } from '@interfaces/query.model'
import BizException from '@exceptions/biz.exception'
import { AuthErrors, CollectionErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin } from '@config/role'
import { NftModel } from '@modules/nft/nft.model'
import UserService from '@modules/user/user.service'
import { COLLECTION_LOGO_SIZES, NftStatus } from '@config/constants'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter } from 'lodash'
import { CreateNftDto } from '@modules/nft/nft.dto'

export default class CollectionService {
    static async createCollection(createCollectionDto: CreateCollectionDto, files: any, operator: IUser) {
        if (!files || !files.length) {
            throw new BizException(CollectionErrors.image_required_error, new ErrorContext('collection.service', 'createCollection', {}))
        }
        files = await resizeImages(files, { logo: COLLECTION_LOGO_SIZES })
        const assets = await uploadFiles(files, 'collections')
        const logos = filter(assets, asset => {
            return asset.fieldname === 'logo'
        })
        const backgrounds = filter(assets, asset => {
            return asset.fieldname === 'background'
        })
        const originalLogo = logos.find(item => item.type === 'original')
        const normalLogo = logos.find(item => item.type === 'normal')
        const smallLogo = logos.find(item => item.type === 'small')
        createCollectionDto.logo = {
            original: originalLogo?.key,
            normal: normalLogo?.key,
            small: smallLogo?.key
        }

        const originalBackground = backgrounds.find(item => item.type === 'original')
        createCollectionDto.background = {
            original: originalBackground?.key
        }

        const model = new CollectionModel({
            ...createCollectionDto,
            creator_key: operator.key,
            owner_key: operator.key,
            items_count: 0
        })
        return await model.save()
    }

    static async createDefaultCollection(createNftDto: CreateNftDto, operator: IUser) {
        const collection = await CollectionModel.findOne({ owner_key: operator.key, type: 'default' })
        if (collection) {
            return collection
        }
        const createCollectionDto = {
            name: createNftDto.name,
            description: createNftDto.description
        }
        const model = new CollectionModel({
            ...createCollectionDto,
            creator_key: operator.key,
            owner_key: operator.key,
            items_count: 0,
            type: 'default'
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
        if (params.owner_key) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ owner_key: { $eq: params.owner_key } })
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

    static async getCollectionDetail(key: string) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(
                CollectionErrors.collection_not_exists_error,
                new ErrorContext('collection.service', 'getCollectionDetail', { key })
            )
        }
        const owner = await UserService.getBriefByKey(collection.owner_key)
        return { collection, owner }
    }

    static async updateCollection(key: string, updateCollectionDto: UpdateCollectionDto, operator: IUser) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== collection.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (updateCollectionDto.name) {
            collection.set('name', updateCollectionDto.name, String)
        }
        if (updateCollectionDto.description) {
            collection.set('description', updateCollectionDto.description, String)
        }
        if (updateCollectionDto.owner_key) {
            collection.set('owner', updateCollectionDto.owner_key, String)
        }
        if (updateCollectionDto.logo) {
            collection.set('logo', updateCollectionDto.logo, String)
        }
        if (updateCollectionDto.background) {
            collection.set('background', updateCollectionDto.background, String)
        }
        return await collection.save()
    }

    static async deleteCollection(key: string, operator: IUser) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'deleteCollection', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== collection.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'deleteCollection', { key }))
        }
        const totalCount = await NftModel.countDocuments({ collection_key: collection.key, status: NftStatus.Approved })
        if (totalCount > 0) {
            throw new BizException(
                CollectionErrors.collection_has_approved_nfts,
                new ErrorContext('collection.service', 'deleteCollection', { totalCount })
            )
        }
        collection.set('removed', true, Boolean)
        return await collection.save()
    }

    static async assignCollection(key: string, assignCollectionDto: AssignCollectionDto, operator: IUser) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'assignCollection', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== collection.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'assignCollection', { key }))
        }
        collection.set('owner_key', assignCollectionDto.user_key, String)
        return await collection.save()
    }
}
