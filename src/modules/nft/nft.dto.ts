import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'
import { NftPriceType } from '@config/constants'
import { map } from 'lodash'

export class ImportNftDto {
    @IsNotEmpty()
    public contract_address: string

    @IsNotEmpty()
    public token_id: string

    @IsOptional()
    public type: string

    // ethereum, polygon
    @IsNotEmpty()
    public platform: string

    // admin can import nfts for user, if not admin and no user_key, get user key from token
    @IsOptional()
    public user_key: string
}

export class CreateNftDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public collection_key: string

    @IsNotEmpty()
    public price: string

    @IsOptional()
    public royalty: string

    @IsOptional()
    public attributes: string

    @IsOptional()
    public meta_data: string

    @IsOptional()
    public animation: any

    @IsOptional()
    public image: any

    @IsNotEmpty()
    public type: string

    @IsOptional()
    public num_sales: number

    @IsOptional()
    public quantity: number = 1
}

export class UpdateNftDto {
    @IsOptional()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public price: string

    @IsOptional()
    public attributes: string

    @IsOptional()
    public meta_data: string

    @IsOptional()
    public collection_key: string

    @IsOptional()
    public animation: any

    @IsOptional()
    public image: any

    @IsOptional()
    public quantity: number = 1
}

export class UpdateNftStatusDto {
    @IsNotEmpty()
    public status: string
}

export class UpdateNftFeaturedDto {
    @IsNotEmpty()
    public featured: boolean
}

export class BulkUpdateNftStatusDto {
    @IsNotEmpty()
    public status: string

    @IsNotEmpty()
    public keys: any
}

export class BulkUpdateNftFeaturedDto {
    @IsNotEmpty()
    public featured: boolean

    @IsNotEmpty()
    public keys: any
}

export class BulkDeleteNftDto {
    @IsNotEmpty()
    public keys: any
}

export class NftRO<T> {
    nft: any
    collection: any
    creator: any
    owner: any
    price_histories: any
    constructor(nft: any, owner: any, creator: any, collection: any, histories: any) {
        this.nft = nft
        this.collection = collection
        if (creator) {
            this.creator = { key: creator.key, chat_name: creator.chat_name, avatar: creator.avatar }
        }
        if (owner) {
            this.owner = { key: owner.key, chat_name: owner.chat_name, avatar: owner.avatar }
        }
        const price_histories = []
        for (let i = 0; i < histories.length; i++) {
            price_histories.push({ time: histories[i].created, value: histories[i].price.toString() })
        }
        this.price_histories = price_histories
    }
}

export class NftOnMarketDto {
    @IsOptional()
    public price: string

    @IsOptional()
    @IsEnum(NftPriceType, {
        message: `type must be one of ${map(NftPriceType, el => el).join(' ')}`
    })
    public price_type: string

    @IsOptional()
    public auction_start: string

    @IsOptional()
    public auction_end: string
}

export class BuyNftDto {
    @IsNotEmpty()
    public symbol: string

    @IsOptional()
    public ip: string

    @IsOptional()
    public agent: string

    @IsOptional()
    public buyer_key: string
}

export class BidNftDto {
    @IsNotEmpty()
    public symbol: string

    @IsNotEmpty()
    public amount: string
}

export class MakeOfferDto {
    @IsNotEmpty()
    public amount: string

    @IsNotEmpty()
    public symbol: string

    @IsOptional()
    public notes: string
}
