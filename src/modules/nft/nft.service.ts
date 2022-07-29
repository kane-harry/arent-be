import { IUser } from '@modules/user/user.interface'
import { CreateNftDto, ImportNftDto } from './nft.dto'
import { NftImportLogModel, NftModel } from './nft.model'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IUser) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        await model.save()
    }

    static async createNft(createNftDto: CreateNftDto, operator: IUser) {
        const model = new NftModel({
            ...createNftDto,
            creator: operator.key,
            owner: operator.key,
            on_market: false,
            status: 'Mint'
        })
        return await model.save()
    }
}
