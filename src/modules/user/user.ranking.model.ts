import { randomBytes } from 'crypto'
import { Schema, model } from 'mongoose'
import { IUserRanking } from './user.interface'

const userRankingSchema = new Schema<IUserRanking>(
    {
        key: {
            type: String,
            required: true,
            index: true,
            unique: true,
            default: () => {
                return randomBytes(8).toString('hex')
            }
        },
        user_key: String,
        number_of_followers: Number,
        number_of_followings: Number,
        number_of_nft_liked: Number,
        number_of_nft_created: Number,
        number_of_created_nfts_owners: Number,
        number_of_created_nfts_orders: Number,
        trading_volume_of_created_nfts: Number,
        number_of_created_nfts_orders_24hrs: Number,
        trading_volume_of_created_nfts_24hrs: Number,
        number_of_buying_orders: Number,
        trading_volume_of_buying: Number,
        number_of_buying_orders_24hrs: Number,
        trading_volume_of_buying_24hrs: Number,
        number_of_selling_orders: Number,
        trading_volume_of_selling: Number,
        number_of_selling_orders_24hrs: Number,
        trading_volume_of_selling_24hrs: Number,
        updated: Date
    },
    {
        toJSON: {
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                return ret
            },
            virtuals: true,
            getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)
const UserRankingModel = model<IUserRanking>('user_rankings', userRankingSchema)

export { UserRankingModel }
