import { Request, Response, NextFunction } from 'express'
import { config } from '@config'
import { IUser } from '@modules/user/user.interface'

export interface CustomRequest extends Request {
    agent?: any
    ip_address?: string
    body: any
    params: any
    query: any
}

export interface AuthenticationRequest extends CustomRequest {
    user: IUser
}

const requestMiddleware = (req: CustomRequest, _: Response, next: NextFunction) => {
    req.query.pageindex = Number(req.query.pageindex || 1)
    req.query.pagesize = Number(req.query.pagesize || config.system.defaultQueryPagesize)
    req.query.sortby = String(req.query.sortby || '_id')
    req.query.orderby = String(req.query.orderby || 'desc')
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
