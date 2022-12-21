import { config } from '@config'
import CollectionService from '@modules/collection/collection.service'
import NftFavoriteModel from '@modules/nft_favorite/nft.favorite.model'
import UserService from '@modules/user/user.service'
import { find, uniq } from 'lodash'
import { INft } from './nft.interface'
import { NftOwnershipLogModel } from './nft.model'

export default class NftHelper {
    static async formatNftRO(nft: INft, requestUserKey?: string) {
        const owner = await UserService.getBriefByKey(nft.owner_key)
        const creator = await UserService.getBriefByKey(nft.creator_key)
        const reviewer = await UserService.getBriefByKey(nft.reviewer_key || '', false)
        const collection = await CollectionService.getCollectionBriefByKey(nft.collection_key)
        const histories = await NftOwnershipLogModel.find({ nft_key: nft.key }, { price: 1, created: 1 }).sort({ created: -1 })
        const price_histories = histories.map(history => {
            return {
                price: Number(history.price),
                currency: history.currency,
                created: history.created
            }
        })
        const last_purchase = {
            user_key: nft.last_purchase?.user_key,
            avatar: nft.last_purchase?.avatar,
            chat_name: nft.last_purchase?.chat_name,
            price: Number(nft.last_purchase?.price),
            secondary_market: nft.last_purchase?.secondary_market,
            currency: nft.last_purchase?.currency,
            txn: nft.last_purchase?.txn,
            type: nft.last_purchase?.type,
            date: nft.last_purchase?.date
        }
        const result: any = {
            key: nft.key,
            name: nft.name,
            currency: nft.currency,
            meta_data: nft.meta_data,
            description: nft.description,
            price: Number(nft.price),
            royalty: Number(nft.royalty),
            tags: nft.tags,
            animation: nft.animation,
            image: nft.image,
            type: nft.type,
            price_type: nft.price_type,
            auction_start: nft.auction_start,
            auction_end: nft.auction_end,
            num_sales: nft.num_sales,
            quantity: nft.quantity,
            creator,
            owner,
            attributes: nft.attributes,
            on_market: nft.on_market,
            listing_date: nft.listing_date,
            last_sale_date: nft.last_sale_date,
            token_id: nft.token_id,
            status: nft.status,
            is_presale: nft.is_presale,
            featured: nft.featured,
            number_of_likes: nft.number_of_likes,
            top_bid: nft.top_bid,
            last_purchase: nft.last_purchase ? last_purchase : null,
            reviewer,
            collection,
            price_histories,
            platform: nft.platform || config.system.nftDefaultPlatform
        }

        if (requestUserKey) {
            result.liked = (await NftFavoriteModel.count({ nft_key: nft.key, user_key: requestUserKey })) > 0
        }
        return result
    }

    static async formatNftListRO(nfts: INft[]) {
        const owner_keys = nfts.map(p => p.owner_key)
        const creator_keys = nfts.map(p => p.creator_key)
        const reviewer_keys = nfts.map(p => {
            return p.reviewer_key ?? 'x'
        })
        const user_keys = uniq(owner_keys.concat(creator_keys, reviewer_keys))
        const users = await UserService.getBriefByKeys(user_keys)

        const collection_keys = nfts.map(p => p.collection_key ?? 'x')
        const collections = await CollectionService.getCollectionBriefByKeys(collection_keys)

        const result = nfts.map(nft => {
            const creator = find(users, { key: nft.creator_key })
            const owner = find(users, { key: nft.owner_key })
            const reviewer = find(users, { key: nft.reviewer_key })
            const collection = find(collections, { key: nft.collection_key })
            return {
                key: nft.key,
                name: nft.name,
                description: nft.description,
                price: Number(nft.price),
                royalty: Number(nft.royalty),
                tags: nft.tags,
                animation: nft.animation,
                image: nft.image,
                type: nft.type,
                price_type: nft.price_type,
                auction_start: nft.auction_start,
                auction_end: nft.auction_end,
                num_sales: nft.num_sales,
                quantity: nft.quantity,
                creator,
                owner,
                attributes: nft.attributes,
                on_market: nft.on_market,
                listing_date: nft.listing_date,
                last_sale_date: nft.last_sale_date,
                token_id: nft.token_id,
                status: nft.status,
                is_presale: nft.is_presale,
                featured: nft.featured,
                number_of_likes: nft.number_of_likes,
                top_bid: nft.top_bid,
                last_purchase: nft.last_purchase,
                reviewer,
                collection
            }
        })
        return result
    }
}
