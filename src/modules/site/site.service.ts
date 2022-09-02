import { ICollection } from '@modules/collection/collection.interface'
import { CollectionModel } from '@modules/collection/collection.model'
import { INft } from '@modules/nft/nft.interface'
import { NftModel } from '@modules/nft/nft.model'
import { IUser } from '@modules/user/user.interface'
import UserModel from '@modules/user/user.model'
import { PrimeCoinProvider } from '@providers/coin.provider'

export default class SiteService {
    static async coinServerHeartBeat() {
        return PrimeCoinProvider.coinServerHeartBeat()
    }

    static async searchMarket(scopes: string, terms: string, limit: number) {
        const result: any = {}
        const reg = new RegExp(terms, 'i')
        const userFilter = { removed: false, chat_name: reg }
        const nftFilter = { removed: false, name: reg }
        const collectionFilter = { removed: false, name: reg }
        let users, nfts, collections

        if (scopes === '' || scopes.toLowerCase() === 'all') {
            users = await UserModel.find<IUser>(userFilter).select('key chat_name avatar').sort({ chat_name: 1 }).limit(limit).exec()

            nfts = await NftModel.find<INft>(nftFilter).select('key name image').sort({ name: 1 }).limit(limit).exec()

            collections = await CollectionModel.find<ICollection>(collectionFilter).select('key name logo').sort({ name: 1 }).limit(limit).exec()
        } else {
            if (scopes.indexOf('user') > -1) {
                users = await UserModel.find<IUser>(userFilter).select('key chat_name avatar').sort({ chat_name: 1 }).limit(limit).exec()
            }
            if (scopes.indexOf('nft') > -1) {
                nfts = await NftModel.find<INft>(nftFilter).select('key name image').sort({ name: 1 }).limit(limit).exec()
            }
            if (scopes.indexOf('collection') > -1) {
                collections = await CollectionModel.find<ICollection>(collectionFilter).select('key name logo').sort({ name: 1 }).limit(limit).exec()
            }
        }
        if (users) {
            result.users = users.map((item: IUser) => {
                return {
                    key: item.key,
                    chat_name: item.chat_name,
                    avatar: item.avatar
                }
            })
        }
        if (nfts) {
            result.nfts = nfts.map((item: INft) => {
                return {
                    key: item.key,
                    name: item.name,
                    image: item.image
                }
            })
        }

        if (collections) {
            result.collections = collections.map((item: ICollection) => {
                return {
                    key: item.key,
                    name: item.name,
                    logo: item.logo
                }
            })
        }

        return result
    }
}
