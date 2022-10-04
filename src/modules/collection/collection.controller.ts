import { Router, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import CollectionService from './collection.service'
import {
    AssignCollectionDto,
    BulkUpdateCollectionFeaturedDto,
    CreateCollectionDto,
    UpdateCollectionDto,
    UpdateCollectionFeaturedDto
} from './collection.dto'
import { requireAuth } from '@utils/authCheck'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { ICollectionFilter } from '@modules/collection/collection.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { IOperator } from '@modules/user/user.interface'
import IOptions from '@interfaces/options.interface'

export default class CollectionController {
    static async createCollection(req: AuthenticationRequest, res: Response) {
        const createCollectionDto: CreateCollectionDto = req.body
        const collection = await CollectionService.createCollection(createCollectionDto, req.files, req.user)
        return res.send(collection)
    }

    static async queryCollections(req: CustomRequest, res: Response) {
        const filter = req.query as ICollectionFilter
        const data = await CollectionService.queryCollections(filter)
        return res.json(data)
    }

    static async getCollectionDetail(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const data = await CollectionService.getCollectionDetail(key)
        return res.json(data)
    }

    static async updateCollection(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const updateCollectionDto: UpdateCollectionDto = req.body
        const collection = await CollectionService.updateCollection(key, updateCollectionDto, req.files, req.user)
        return res.json(collection)
    }

    static async deleteCollection(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const collection = await CollectionService.deleteCollection(key, req.user)
        return res.json(collection)
    }

    static async queryUserCollections(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as ICollectionFilter
        filter.owner_key = key
        const data = await CollectionService.queryCollections(filter)
        return res.json(data)
    }

    static async assignCollection(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const assignCollectionDto: AssignCollectionDto = req.body
        const data = await CollectionService.assignCollection(key, assignCollectionDto, req.user)
        return res.json(data)
    }

    static async getCollectionFeatured(req: CustomRequest, res: Response) {
        const filter = req.query as ICollectionFilter
        filter.featured = true
        const data = await CollectionService.queryCollections(filter)
        return res.json(data)
    }

    static async updateCollectionFeatured(req: AuthenticationRequest, res: Response) {
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
        const updateCollectionDto: UpdateCollectionFeaturedDto = req.body
        const data = await CollectionService.updateCollectionFeatured(key, updateCollectionDto, operator, options)
        return res.json(data)
    }

    static async bulkUpdateCollectionFeatured(req: AuthenticationRequest, res: Response) {
        const operator: IOperator = {
            email: req.user?.email,
            key: req.user?.key,
            role: req.user.role
        }
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }

        const updateCollectionDto: BulkUpdateCollectionFeaturedDto = req.body
        const { keys, featured } = updateCollectionDto
        const data = []
        for (const key of keys) {
            try {
                const item = await CollectionService.updateCollectionFeatured(key, { featured: featured }, operator, options)
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }
}
