import { Request, Response, NextFunction } from 'express'
import { UserDto } from '@modules/user/user.dto'
import { config } from '@config'

export interface CustomRequest extends Request {
    agent?: any
    ip_address?: string
    body: any
    params: any
    query: any
}

export interface AuthenticationRequest extends CustomRequest {
    user: UserDto
}

const requestMiddleware = (req: CustomRequest, _: Response, next: NextFunction) => {
    req.query.pageindex = Number(req.query.pageindex || 1)
    req.query.pagesize = Number(req.query.pagesize || config.system.defaultQueryPagesize)
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
