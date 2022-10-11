import CollectionService from '@modules/collection/collection.service'
import NftFavoriteModel from '@modules/nft_favorite/nft.favorite.model'
import UserService from '@modules/user/user.service'
import { INft } from './nft.interface'
import { NftOwnershipLogModel } from './nft.model'

export default class NftHelper {
    static async formatNftRO(nft: INft, requestUserKey?: string) {
        const owner = await UserService.getBriefByKey(nft.owner_key)
        const creator = await UserService.getBriefByKey(nft.creator_key)
        const reviewer = await UserService.getBriefByKey(nft.reviewer_key || '', false)
        const collection = await CollectionService.getCollectionBriefByKey(nft.collection_key)
        const price_histories = await NftOwnershipLogModel.find({ nft_key: nft.key }, { price: 1, created: 1 }).sort({ created: -1 })

        const result: any = {
            key: nft.key,
            name: nft.name,
            description: nft.description,
            price: Number(nft.price),
            royalty: Number(nft.royalty),
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
            collection,
            price_histories
        }

        if (requestUserKey) {
            result.liked = (await NftFavoriteModel.count({ nft_key: nft.key, user_key: requestUserKey })) > 0
        }
        return result
    }
}
