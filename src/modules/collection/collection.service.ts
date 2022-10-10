import { AssignCollectionDto, CreateCollectionDto, UpdateCollectionDto, UpdateCollectionFeaturedDto } from './collection.dto'
import { CollectionModel } from './collection.model'
import { ICollection, ICollectionFilter } from '@modules/collection/collection.interface'
import { QueryRO } from '@interfaces/query.model'
import BizException from '@exceptions/biz.exception'
import { AuthErrors, CategoryErrors, CollectionErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin } from '@config/role'
import { NftModel, NftSaleLogModel } from '@modules/nft/nft.model'
import UserService from '@modules/user/user.service'
import { COLLECTION_LOGO_SIZES, NftStatus } from '@config/constants'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter } from 'lodash'
import { CreateNftDto } from '@modules/nft/nft.dto'
import IOptions from '@interfaces/options.interface'
import moment from 'moment'
import CategoryService from '@modules/category/category.service'
import { IOperator } from '@interfaces/operator.interface'

export default class CollectionService {
    static async createCollection(createCollectionDto: CreateCollectionDto, files: any, operator: IOperator) {
        if (createCollectionDto.category_key) {
            const category = await CategoryService.getCategory(createCollectionDto.category_key)
            if (!category) {
                throw new BizException(
                    CategoryErrors.item_not_found_error,
                    new ErrorContext('collection.service', 'createCollection', { category_key: createCollectionDto.category_key })
                )
            }
        }

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
            key: undefined,
            ...createCollectionDto,
            creator_key: operator.key,
            owner_key: operator.key,
            items_count: 0
        })
        return await model.save()
    }

    static async createDefaultCollection(createNftDto: CreateNftDto, operator: IOperator) {
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
        const filter: any = { $and: [{ removed: false }] }
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms, 'i')
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
        if (params.featured) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ featured: { $eq: params.featured } })
        }
        if (params.category) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ category_key: { $eq: params.category } })
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

    static async updateCollection(key: string, updateCollectionDto: UpdateCollectionDto, files: any, operator: IOperator) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== collection.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (updateCollectionDto.category_key) {
            const category = await CategoryService.getCategory(updateCollectionDto.category_key)
            if (!category) {
                throw new BizException(
                    CategoryErrors.item_not_found_error,
                    new ErrorContext('collection.service', 'updateCollection', { category_key: updateCollectionDto.category_key })
                )
            }
        }
        if (files && files.length) {
            files = await resizeImages(files, { logo: COLLECTION_LOGO_SIZES })
            const assets = await uploadFiles(files, 'collections')
            const logos = filter(assets, asset => {
                return asset.fieldname === 'logo'
            })
            const backgrounds = filter(assets, asset => {
                return asset.fieldname === 'background'
            })
            if (logos.length) {
                const originalLogo = logos.find(item => item.type === 'original')
                const normalLogo = logos.find(item => item.type === 'normal')
                const smallLogo = logos.find(item => item.type === 'small')
                updateCollectionDto.logo = {
                    original: originalLogo?.key,
                    normal: normalLogo?.key,
                    small: smallLogo?.key
                }
            }
            if (backgrounds.length) {
                const originalBackground = backgrounds.find(item => item.type === 'original')
                updateCollectionDto.background = {
                    original: originalBackground?.key
                }
            }
        }
        collection.set('name', updateCollectionDto.name, String)
        collection.set('description', updateCollectionDto.description, String)

        if (updateCollectionDto.owner_key) {
            collection.set('owner_key', updateCollectionDto.owner_key, String)
        }
        if (updateCollectionDto.logo) {
            collection.set('logo', updateCollectionDto.logo, Object)
        }
        if (updateCollectionDto.background) {
            collection.set('background', updateCollectionDto.background, Object)
        }
        collection.set('website', updateCollectionDto.website, String)
        collection.set('discord', updateCollectionDto.discord, String)
        collection.set('instagram', updateCollectionDto.instagram, String)
        collection.set('twitter', updateCollectionDto.twitter, String)
        return await collection.save()
    }

    static async deleteCollection(key: string, operator: IOperator) {
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

    static async assignCollection(key: string, params: AssignCollectionDto, operator: IOperator) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'assignCollection', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== collection.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'assignCollection', { key }))
        }
        const user = await UserService.getBriefByKey(params.user_key)
        if (!user) {
            throw new BizException(
                AuthErrors.user_not_exists_error,
                new ErrorContext('collection.service', 'assignCollection', { user_key: params.user_key })
            )
        }
        collection.set('owner_key', params.user_key, String)
        return await collection.save()
    }

    static async updateCollectionFeatured(
        key: string,
        updateCollectionFeaturedDto: UpdateCollectionFeaturedDto,
        operator: IOperator,
        options: IOptions
    ) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(
                CollectionErrors.collection_not_exists_error,
                new ErrorContext('collection.service', 'updateCollectionFeatured', { key })
            )
        }
        collection.set('featured', updateCollectionFeaturedDto.featured ?? collection.featured, Boolean)
        const updateCollection = await collection.save()
        return updateCollection
    }

    static async getCollectionAnalytics(key: string) {
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(
                CollectionErrors.collection_not_exists_error,
                new ErrorContext('collection.service', 'getCollectionAnalytics', { key })
            )
        }
        const analytics = collection.analytics
        // @ts-ignore
        if (!analytics || analytics.expired < moment().unix()) {
            return await CollectionService.calculateAnalytics(collection)
        }
        return analytics
    }

    static async calculateAnalytics(collection: ICollection) {
        const filter = { collection_key: collection.key }
        const nftCount = await NftModel.countDocuments(filter)
        const owners = await NftModel.aggregate([{ $match: filter }, { $group: { _id: '$owner_key', count: { $sum: 1 } } }])
        const floorPrices = await NftModel.aggregate([{ $match: filter }, { $group: { _id: '$item', min: { $min: '$price' } } }])
        const volumes = await NftSaleLogModel.aggregate([
            { $match: filter },
            { $group: { _id: '$collection_key', volume: { $sum: '$order_value' } } }
        ])
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD')
        const volumeByDays = await NftSaleLogModel.aggregate([
            { $match: filter },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created' } }, volume: { $sum: '$order_value' } } }
        ])
        const volumeYesterdays = volumeByDays.filter(item => item._id === yesterday)
        const sales = await NftSaleLogModel.aggregate([{ $match: filter }, { $group: { _id: '$collection_key', count: { $sum: 1 } } }])
        const analytics = {
            nft_count: nftCount,
            owner_count: owners.length,
            floor_price: floorPrices.length ? Number(floorPrices[0].min) : 0,
            volume: volumes.length ? Number(volumes[0].volume) : 0,
            volume_last: volumeYesterdays.length ? Number(volumeYesterdays[0].volume) : 0,
            sales_count: sales.length ? sales[0].count : 0,
            expired: moment().add(60, 'minutes').unix()
        }
        collection.analytics = analytics
        // @ts-ignore
        await collection.save()
        return analytics
    }
}
