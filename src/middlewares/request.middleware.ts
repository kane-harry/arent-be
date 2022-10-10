import { Request, Response, NextFunction } from 'express'
import { config } from '@config'
import { IOperator } from '@interfaces/operator.interface'
import jwtDecode from 'jwt-decode'
import UserModel from '@modules/user/user.model'
import IOptions from '@interfaces/options.interface'

export interface CustomRequest extends Request {
    options?: IOptions
    body: any
    params: any
    query: any
    user_key?: string
}

export interface IAuthorizedUser extends IOperator {}

export interface AuthenticationRequest extends CustomRequest {
    user: IAuthorizedUser
}

const requestMiddleware = async (req: CustomRequest, _: Response, next: NextFunction) => {
    req.query.page_index = Number(req.query.page_index || 1)
    req.query.page_size = Number(req.query.page_size || config.system.defaultQueryPagesize)
    req.query.sort_by = String(req.query.sort_by || '_id')
    req.query.order_by = String(req.query.order_by || 'desc')
    const agent = req.headers['user-agent']
    const ip =
        String(req.headers['x-forwarded-for'] || '')
            .split(',')
            .pop()
            ?.trim() ||
        req.socket.remoteAddress ||
        req.ip
    req.options = { agent, ip }
    if (req.headers && req.headers.authorization) {
        const token = req.headers.authorization.slice(7)
        try {
            const payload: any = jwtDecode(token)
            const user = await UserModel.findOne({ key: payload.key, removed: false })
            if (user) {
                req.user_key = payload.key
            }
        } catch (e) {}
    }
    next()
}

export default requestMiddleware
