import { AssignCollectionDto, CreateCollectionDto, UpdateCollectionDto, UpdateCollectionFeaturedDto } from './collection.dto'
import { CollectionModel, CollectionRankingModel } from './collection.model'
import { ICollection, ICollectionFilter, ICollectionRanking } from '@modules/collection/collection.interface'
import { QueryRO } from '@interfaces/query.model'
import BizException from '@exceptions/biz.exception'
import { AuthErrors, CategoryErrors, CollectionErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin } from '@config/role'
import { NftModel, NftSaleLogModel } from '@modules/nft/nft.model'
import UserService from '@modules/user/user.service'
import { COLLECTION_BACKGROUND_SIZES, COLLECTION_LOGO_SIZES, CollectionType, NftStatus } from '@config/constants'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter, sumBy } from 'lodash'
import { CreateNftDto } from '@modules/nft/nft.dto'
import IOptions from '@interfaces/options.interface'
import moment from 'moment'
import CategoryService from '@modules/category/category.service'
import { IOperator } from '@interfaces/operator.interface'
import { roundUp } from '@utils/utility'
import { uploadIpfs } from '@utils/ipfsUpload'

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
        files = await resizeImages(files, { logo: COLLECTION_LOGO_SIZES, background: COLLECTION_BACKGROUND_SIZES })
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

    static async createDefaultCollection(params: CreateNftDto, operator: IOperator) {
        const collection = await CollectionModel.findOne({ owner_key: operator.key, type: CollectionType.Default })
        if (collection) {
            return collection
        }
        const model = new CollectionModel({
            key: undefined,
            name: params.name,
            description: params.description,
            creator_key: operator.key,
            owner_key: operator.key,
            items_count: 0,
            type: CollectionType.Default
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
        const category = await CategoryService.getCategory(collection.category_key)
        return { collection, owner, category }
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
            files = await resizeImages(files, { logo: COLLECTION_LOGO_SIZES, background: COLLECTION_BACKGROUND_SIZES })
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
        collection.set('website', updateCollectionDto.website ?? collection.website, String)
        collection.set('discord', updateCollectionDto.discord ?? collection.discord, String)
        collection.set('instagram', updateCollectionDto.instagram ?? collection.instagram, String)
        collection.set('twitter', updateCollectionDto.twitter ?? collection.twitter, String)
        collection.set('category_key', updateCollectionDto.category_key ?? collection.category_key, String)
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
        const totalCount = await NftModel.countDocuments({ collection_key: collection.key, status: NftStatus.Approved, removed: false })
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
        options?: IOptions
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

    static async getCollectionRanking(key: string) {
        let collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(
                CollectionErrors.collection_not_exists_error,
                new ErrorContext('collection.service', 'getCollectionRanking', { key })
            )
        }

        if (collection.ranking) {
            const requireUpdate = moment().subtract(-1, 'hour').isAfter(moment(collection.ranking.updated))
            if (requireUpdate) {
                collection = await CollectionService.generateCollectionRanking(key)
            }
        } else {
            collection = await CollectionService.generateCollectionRanking(key)
        }
        return collection?.ranking
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

    static async getCollectionBriefByKeys(keys: String[]) {
        const items = await CollectionModel.find({ key: { $in: keys } }).select('key name logo')
        return items
    }

    static async getCollectionBriefByKey(key?: String) {
        const item = await CollectionModel.findOne({ key: key }).select('key name logo')
        return item
    }

    static async getTopCollections() {
        const data = await CollectionModel.find({}).sort({ 'ranking.trading_volume': -1 }).limit(10).exec()
        return data
    }

    static async generateCollectionRanking(collection_key: string) {
        // 1.1 market price - Average of last 5 orders
        // get last 5 orders
        const orders = await NftSaleLogModel.find({ collection_key }, { unit_price: 1 }).sort({ created: -1 }).limit(5).exec()
        const order_volume = sumBy(orders, 'unit_price')
        const market_price = orders.length > 0 ? roundUp(order_volume / orders.length, 8) : 0

        // 1.2 owners
        const owners = await NftModel.aggregate([{ $match: { collection_key } }, { $group: { _id: '$owner_key', count: { $sum: 1 } } }])
        const number_of_owners = owners.length

        // 1.3 trading volume
        const volumeTotal = await NftSaleLogModel.aggregate([
            { $match: { collection_key } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_orders = volumeTotal && volumeTotal[0] ? volumeTotal[0].count : 0
        const trading_volume = volumeTotal && volumeTotal[0] ? parseFloat(volumeTotal[0].trading_volume) : 0

        // 1.4 24 hrs volume
        const volume24Hrs = await NftSaleLogModel.aggregate([
            { $match: { collection_key, created: { $gte: moment().add(-1, 'days').toDate() } } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_orders_24hrs = volume24Hrs && volume24Hrs[0] ? volume24Hrs[0].count : 0
        const trading_volume_24hrs = volume24Hrs && volume24Hrs[0] ? parseFloat(volume24Hrs[0].trading_volume) : 0

        // 1.5 nft prices - Minimum price available in the market for the collection
        const nftPriceAggegates = await NftModel.aggregate([
            { $match: { collection_key, status: NftStatus.Approved, removed: false } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    max_price: { $max: '$price' },
                    min_price: { $min: '$price' },
                    avg_price: { $avg: '$price' }
                }
            }
        ])
        const number_of_items = nftPriceAggegates && nftPriceAggegates[0] ? nftPriceAggegates[0].count : 0
        const item_floor_price = nftPriceAggegates && nftPriceAggegates[0] ? parseFloat(nftPriceAggegates[0].min_price) : 0
        const item_celling_price = nftPriceAggegates && nftPriceAggegates[0] ? parseFloat(nftPriceAggegates[0].max_price) : 0
        const item_average_price = nftPriceAggegates && nftPriceAggegates[0] ? parseFloat(nftPriceAggegates[0].avg_price) : 0

        // 1.6 order prices
        const orderPriceAggregate = await NftSaleLogModel.aggregate([
            { $match: { collection_key, status: NftStatus.Approved, removed: false } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    max_price: { $max: '$unit_price' },
                    min_price: { $min: '$unit_price' },
                    avg_price: { $avg: '$unit_price' }
                }
            }
        ])
        const order_average_price = orderPriceAggregate && orderPriceAggregate[0] ? parseFloat(orderPriceAggregate[0].min_price) : 0
        const order_floor_price = orderPriceAggregate && orderPriceAggregate[0] ? parseFloat(orderPriceAggregate[0].max_price) : 0
        const order_celling_price = orderPriceAggregate && orderPriceAggregate[0] ? parseFloat(orderPriceAggregate[0].avg_price) : 0

        const ranking: ICollectionRanking = {
            collection_key,
            market_price,
            number_of_owners,
            trading_volume,
            number_of_orders,
            trading_volume_24hrs,
            number_of_orders_24hrs,
            number_of_items,
            item_average_price,
            item_floor_price,
            item_celling_price,
            order_average_price,
            order_floor_price,
            order_celling_price,
            updated: new Date()
        }
        const collection = await CollectionModel.findOneAndUpdate(
            { key: collection_key },
            {
                $set: { ranking }
            },
            { new: true }
        )
        await new CollectionRankingModel({
            ...ranking
        }).save()
        return collection
    }

    static async uploadCollectionIpfs(collection: ICollection) {
        // @ts-ignore
        const logo = collection.logo?.original
        // @ts-ignore
        const background = collection?.background.original
        const files = [
            { field_name: 'logo', aws_key: logo },
            { field_name: 'background', aws_key: background }
        ]
        const assets = await uploadIpfs(files)
        const updateLogo = { ...collection.logo, ipfs_cid: assets[0]?.ipfs_cid }
        // @ts-ignore
        const updateBackground = { ...collection.background, ipfs_cid: assets[1]?.ipfs_cid }
        const updateData = { logo: updateLogo, background: updateBackground }
        const data = await CollectionModel.findOneAndUpdate(
            { key: collection.key },
            {
                $set: updateData
            },
            { new: true }
        )
        return data
    }
}
