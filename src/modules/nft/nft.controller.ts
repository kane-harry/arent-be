// @ts-nocheck
import { Request, Response } from 'express'
import NftService from './nft.service'
import { IUser } from '@modules/user/user.interface'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { INftFilter } from '@modules/nft/nft.interface'
import {
    BulkDeleteNftDto,
    BulkUpdateNftStatusDto,
    CreateNftDto,
    ImportNftDto,
    UpdateNftDto,
    UpdateNftStatusDto,
    NftOnMarketDto,
    BidNftDto,
    MakeOfferDto
} from './nft.dto'

export default class NftController {
    static async importNft(req: Request, res: Response) {
        const payload: ImportNftDto = req.body // should be an arrary since we support bulk import
        const operator = req.user as IUser
        const data = await NftService.importNft(payload, operator)
        return res.send(data)
    }

    static async createNft(req: AuthenticationRequest, res: Response) {
        const createNftDto: CreateNftDto = req.body
        createNftDto.attributes = createNftDto.attributes && createNftDto.attributes.length ? JSON.parse(createNftDto.attributes) : []
        createNftDto.meta_data = createNftDto.meta_data && createNftDto.meta_data.length ? JSON.parse(createNftDto.meta_data) : []
        const files = req.files
        const nft = await NftService.createNft(createNftDto, files, req.user, { req })
        return res.json(nft)
    }

    static async queryNFTs(req: CustomRequest, res: Response) {
        const filter = req.query as INftFilter
        const data = await NftService.queryNfts(filter)
        return res.json(data)
    }

    static async queryMyNFTs(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as INftFilter
        filter.owner_key = key
        const data = await NftService.queryNfts(filter)
        return res.json(data)
    }

    static async getNftDetail(req: CustomRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.getNftDetail(key)
        return res.json(data)
    }

    static async updateNft(req: CustomRequest, res: Response) {
        const { key } = req.params
        const updateNftDto: UpdateNftDto = req.body
        updateNftDto.attributes = updateNftDto.attributes && updateNftDto.attributes.length ? JSON.parse(updateNftDto.attributes) : null
        updateNftDto.meta_data = updateNftDto.meta_data && updateNftDto.meta_data.length ? JSON.parse(updateNftDto.meta_data) : null
        const data = await NftService.updateNft(key, updateNftDto, req.user, { req })
        return res.json(data)
    }

    static async updateNftStatus(req: CustomRequest, res: Response) {
        const { key } = req.params
        const updateNftDto: UpdateNftStatusDto = req.body
        const data = await NftService.updateNftStatus(key, updateNftDto, req.user, { req })
        return res.json(data)
    }

    static async bulkUpdateNftStatus(req: CustomRequest, res: Response) {
        const updateNftDto: BulkUpdateNftStatusDto = req.body
        const { keys, status } = updateNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.updateNftStatus(key, { status: status }, req.user, { req })
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    static async deleteNft(req: CustomRequest, res: Response) {
        const { key } = req.params
        const nft = await NftService.deleteNft(key, req.user, { req })
        return res.json(nft)
    }

    static async bulkDeleteNft(req: CustomRequest, res: Response) {
        const deleteNftDto: BulkDeleteNftDto = req.body
        const { keys } = deleteNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.deleteNft(key, req.user, { req })
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    static async onMarket(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const params: NftOnMarketDto = req.body
        const data = await NftService.onMarket(key, params, { req })
        return res.json(data)
    }

    static async offMarket(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.offMarket(key, { req })
        return res.json(data)
    }

    static async buyNft(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.processPurchase(key, req.user, req.agent, req.ip_address)
        return res.json(data)
    }

    static async bidNft(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const params: BidNftDto = req.body
        const data = await NftService.bidNft(key, params, { req })
        return res.json(data)
    }

    static async getNftBids(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.getNftBids(key)
        return res.json(data)
    }

    static async makeOffers(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const params: MakeOfferDto = req.body
        const data = await NftService.makeOffers(key, params, { req })
        return res.json(data)
    }

    static async getOffers(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.getOffers(key)
        return res.json(data)
    }

    static async acceptOffers(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.processAcceptOffer(key, req.user, req.agent, req.ip_address)
        return res.json(data)
    }

    static async rejectOffers(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.rejectOffers(key, { req })
        return res.json(data)
    }

    static async cancelOffers(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.cancelOffers(key, { req })
        return res.json(data)
    }
}
