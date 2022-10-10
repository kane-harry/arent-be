import { Request, Response, NextFunction } from 'express'
import { config } from '@config'
import { IOperator } from '@interfaces/operator.interface'

export interface CustomRequest extends Request {
    agent?: any
    ip_address?: string
    body: any
    params: any
    query: any
}

export interface IAuthorizedUser extends IOperator {
    avatar?: object
    status?: string
}

export interface AuthenticationRequest extends CustomRequest {
    user: IAuthorizedUser
}

const requestMiddleware = (req: CustomRequest, _: Response, next: NextFunction) => {
    req.query.page_index = Number(req.query.page_index || 1)
    req.query.page_size = Number(req.query.page_size || config.system.defaultQueryPagesize)
    req.query.sort_by = String(req.query.sort_by || '_id')
    req.query.order_by = String(req.query.order_by || 'desc')
    req.agent = req.headers['user-agent']
    req.ip_address =
        String(req.headers['x-forwarded-for'] || '')
            .split(',')
            .pop()
            ?.trim() ||
        req.socket.remoteAddress ||
        req.ip
    next()
}

export default requestMiddleware
