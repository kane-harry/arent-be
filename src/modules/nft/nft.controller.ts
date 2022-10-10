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
    MakeOfferDto,
    UpdateNftFeaturedDto,
    BulkUpdateNftFeaturedDto
} from './nft.dto'

export default class NftController {
    static async importNft(req: AuthenticationRequest, res: Response) {
        const payload: ImportNftDto = req.body // should be an arrary since we support bulk import
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key
        }
        const data = await NftService.importNft(payload, operator)
        return res.send(data)
    }

    static async createNft(req: AuthenticationRequest, res: Response) {
        const createNftDto: CreateNftDto = req.body
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        createNftDto.attributes = createNftDto.attributes && createNftDto.attributes.length ? JSON.parse(createNftDto.attributes) : []
        createNftDto.meta_data = createNftDto.meta_data && createNftDto.meta_data.length ? JSON.parse(createNftDto.meta_data) : []
        const files = req.files
        const nft = await NftService.createNft(createNftDto, files, operator, options)
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
        const userKey = req.user_key
        const { key } = req.params
        const data = await NftService.getNftDetail(key, userKey)
        return res.json(data)
    }

    static async getRelatedNfts(req: CustomRequest, res: Response) {
        const { key } = req.params
        const limit = Number(req.query.limit || 4)
        const data = await NftService.getRelatedNfts(key, limit)
        return res.json(data)
    }

    static async updateNft(req: CustomRequest, res: Response) {
        const { key } = req.params
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const updateNftDto: UpdateNftDto = req.body
        updateNftDto.attributes = updateNftDto.attributes && updateNftDto.attributes.length ? JSON.parse(updateNftDto.attributes) : null
        updateNftDto.meta_data = updateNftDto.meta_data && updateNftDto.meta_data.length ? JSON.parse(updateNftDto.meta_data) : null
        const data = await NftService.updateNft(key, updateNftDto, operator, options)
        return res.json(data)
    }

    static async updateNftStatus(req: CustomRequest, res: Response) {
        const { key } = req.params
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const updateNftDto: UpdateNftStatusDto = req.body
        const data = await NftService.updateNftStatus(key, updateNftDto, operator, options)
        return res.json(data)
    }

    static async bulkUpdateNftStatus(req: CustomRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }

        const updateNftDto: BulkUpdateNftStatusDto = req.body
        const { keys, status } = updateNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.updateNftStatus(key, { status: status }, operator, options)
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    static async deleteNft(req: CustomRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const nft = await NftService.deleteNft(key, operator, options)
        return res.json(nft)
    }

    static async bulkDeleteNft(req: CustomRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const deleteNftDto: BulkDeleteNftDto = req.body
        const { keys } = deleteNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.deleteNft(key, operator, options)
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    static async onMarket(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const params: NftOnMarketDto = req.body
        const data = await NftService.onMarket(key, params, operator, options)
        return res.json(data)
    }

    static async offMarket(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const data = await NftService.offMarket(key, operator, options)
        return res.json(data)
    }

    static async buyNft(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const data = await NftService.processPurchase(key, operator, options)
        return res.json(data)
    }

    static async bidNft(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const params: BidNftDto = req.body
        const data = await NftService.bidNft(key, params, operator, options)
        return res.json(data)
    }

    static async getNftBids(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.getNftBids(key)
        return res.json(data)
    }

    static async makeOffer(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const params: MakeOfferDto = req.body
        const data = await NftService.makeOffer(key, params, operator, options)
        return res.json(data)
    }

    static async getOffers(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.getOffers(key)
        return res.json(data)
    }

    static async acceptOffer(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const data = await NftService.processAcceptOffer(key, operator, options)
        return res.json(data)
    }

    static async rejectOffer(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const data = await NftService.rejectOffer(key, operator, options)
        return res.json(data)
    }

    static async cancelOffer(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role,
            avatar: req.user.avatar,
            chat_name: req.user.chat_name
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const { key } = req.params
        const data = await NftService.cancelOffer(key, operator, options)
        return res.json(data)
    }

    static async getNftFeatured(req: CustomRequest, res: Response) {
        const filter = req.query as INftFilter
        filter.featured = true
        const data = await NftService.queryNfts(filter)
        return res.json(data)
    }

    static async updateNftFeatured(req: CustomRequest, res: Response) {
        const { key } = req.params
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const updateNftDto: UpdateNftFeaturedDto = req.body
        const data = await NftService.updateNftFeatured(key, updateNftDto, operator, options)
        return res.json(data)
    }

    static async bulkUpdateNftFeatured(req: CustomRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }

        const updateNftDto: BulkUpdateNftFeaturedDto = req.body
        const { keys, featured } = updateNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.updateNftFeatured(key, { featured: featured }, operator, options)
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }
}
