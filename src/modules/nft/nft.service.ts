// @ts-nocheck
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
        createNftDto.attributes = createNftDto.attributes && createNftDto.attributes.length ? JSON.parse(createNftDto.attributes) : []
        if (res?.locals?.files_uploaded?.length) {
            createNftDto.image = { normal: '', thumb: '' }
            const original = res.locals.files_uploaded.find((item: any) => item.type === 'original' && item.fieldname === 'nft')
            createNftDto.image.normal = original?.key
            const thumb = res.locals.files_uploaded.find((item: any) => item.type === 'thumb' && item.fieldname === 'nft')
            createNftDto.image.thumb = thumb?.key

            const images = res.locals.files_uploaded.filter((item: any) => item.fieldname === 'images')
            const tempImages = {}
            images.forEach((image: any) => {
                const name = image.name
                const type = image.type
                tempImages[name] = tempImages[name] ?? {}
                tempImages[name].name = name
                tempImages[name][type] = image.key
            })
            createNftDto.images = Object.values(tempImages)
        }
        const model = new NftModel({
            ...payload,
            creator: operator.key,
            owner: operator.key
        })
        await model.save()
    }
}
