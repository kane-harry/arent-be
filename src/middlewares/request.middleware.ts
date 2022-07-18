import { Request, Response, NextFunction } from 'express'
import { config } from '@config'
import { IUser } from '@modules/user/user.interface'
import { forEach, last, split, startsWith } from 'lodash'

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

const mapQuery = (req: CustomRequest) => {
    const queries = req.query

    const prefixSort = 'sort_'
    const prefixFilter = 'filter_'

    const sorts: { [key: string]: -1 | 1 } = {}
    const filters: { [key: string]: string } = {}
    forEach(queries, (value, key) => {
        if (startsWith(key, prefixSort) && (value === 'asc' || value === 'desc')) {
            sorts[String(last(split(key, prefixSort)))] = value === 'asc' ? 1 : -1
        }
        if (startsWith(key, prefixFilter) && value) {
            filters[String(last(split(key, prefixFilter)))] = String(value)
        }
    })

    return { sorts, filters }
}

const requestMiddleware = (req: CustomRequest, _: Response, next: NextFunction) => {
    const { sorts, filters } = mapQuery(req)

    req.query.pageindex = Number(req.query.pageindex || 1)
    req.query.pagesize = Number(req.query.pagesize || config.system.defaultQueryPagesize)
    req.query.sortby = String(req.query.sortby || '_id')
    req.query.orderby = String(req.query.orderby || 'desc')

    req.query.sorts = sorts
    req.query.filters = filters

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
