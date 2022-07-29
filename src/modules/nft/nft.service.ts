import { IUser } from '@modules/user/user.interface'
import { ImportNftDto } from './nft.dto'
import { INft, INftImportLog } from './nft.interface'
import { NftImportLogModel, NftModel } from './nft.model'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IUser) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        await model.save()
    }

    static async createNft(payload: INft, operator: IUser) {
        const model = new NftModel({
            ...payload
        })
        await model.save()
    }
}
