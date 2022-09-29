import { model, Schema } from 'mongoose'
import { randomBytes } from 'crypto'
import { INftFavorite } from '@modules/nft_favorite/nft.favorite.interface'

const nftFavoriteSchema = new Schema<INftFavorite>(
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
        nft_key: String,
        collection_key: String
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const NftFavoriteModel = model<INftFavorite>('nft_favorites', nftFavoriteSchema)

export default NftFavoriteModel
